// Node.js 内置模块
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// 第三方库
const axios = require('axios'); // 用于API通信
const Docker = require('dockerode');

const docker = new Docker(); // 默认连接本地Docker守护进程

// ---- 配置 ----
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api'; // 主应用API地址
const POLLING_INTERVAL_MS = process.env.POLLING_INTERVAL_MS || 5000; // 轮询间隔
const DOCKER_EXECUTION_TIMEOUT_MS = process.env.DOCKER_EXECUTION_TIMEOUT_MS || 5000; // 代码执行超时
const CONTAINER_WORKING_DIR = '/usr/src/app'; // 容器内的工作目录
const TEMP_DIR_BASE = path.join(os.tmpdir(), 'kestrel-judge'); // 临时文件基础目录

// 语言特定配置
const LANGUAGE_SPECS = {
    python: {
        image: process.env.PYTHON_JUDGE_IMAGE || 'kestrel-python-judge',
        fileName: 'solution.py',
        compileCmd: null,
        runCmd: (fileNameInContainer) => ['python', fileNameInContainer],
    },
    javascript: {
        image: process.env.JS_JUDGE_IMAGE || 'kestrel-js-judge',
        fileName: 'solution.js',
        compileCmd: null,
        runCmd: (fileNameInContainer) => ['node', fileNameInContainer],
    },
    cpp: {
        image: process.env.CPP_JUDGE_IMAGE || 'kestrel-cpp-judge',
        sourceFileName: 'solution.cpp',
        executableFileName: 'solution_exec', // 编译后在容器内的可执行文件名
        compileCmd: (sourceFile, outputFile) => ['g++', '-std=c++17', '-O2', '-w', '-o', outputFile, sourceFile], // -w 抑制警告
        runCmd: (executableFileInContainer) => [`./${executableFileInContainer}`],
    },
    // 可以根据 server/api.js 中支持的语言列表添加更多
};

// ---- 辅助函数：文件和目录操作 ----
async function ensureBaseTempDir() {
    try {
        await fs.access(TEMP_DIR_BASE);
    } catch (e) {
        await fs.mkdir(TEMP_DIR_BASE, { recursive: true });
    }
}

async function createTempDirAndFile(code, fileName) {
    await ensureBaseTempDir();
    const tempDir = await fs.mkdtemp(path.join(TEMP_DIR_BASE, 'sub-'));
    const filePathOnHost = path.join(tempDir, fileName);
    await fs.writeFile(filePathOnHost, code, 'utf-8');
    console.log(`[JudgeWorker] Created temp file: ${filePathOnHost}`);
    return { tempDirOnHost: tempDir, fileNameInDir: fileName };
}

async function cleanupTempDir(tempDirOnHost) {
    if (tempDirOnHost) {
        await fs.rm(tempDirOnHost, { recursive: true, force: true })
            .then(() => console.log(`[JudgeWorker] Cleaned up temp dir: ${tempDirOnHost}`))
            .catch(err => console.error(`[JudgeWorker] Error cleaning up temp dir ${tempDirOnHost}:`, err));
    }
}

// ---- 辅助函数：Dockerode 运行代码 ----
async function runInDocker(language, code, inputText) {
    const spec = LANGUAGE_SPECS[language.toLowerCase()];
    if (!spec) {
        return { errorType: 'System Error', message: `Unsupported language: ${language}`, stdout: '', stderr: '' };
    }

    let tempDirInfo;
    let compileContainer = null;
    let runContainer = null;
    const result = { stdout: '', stderr: '', errorType: null, message: '', duration: 0 };
    const startTime = Date.now();

    try {
        const mainFileName = spec.fileName || spec.sourceFileName;
        tempDirInfo = await createTempDirAndFile(code, mainFileName);
        
        const binds = [`${tempDirInfo.tempDirOnHost}:${CONTAINER_WORKING_DIR}:ro`];

        if (spec.compileCmd) {
            console.log(`[JudgeWorker] Compiling ${language} code for ${mainFileName}...`);
            const compileContainerOptions = {
                Image: spec.image,
                Cmd: spec.compileCmd(mainFileName, spec.executableFileName),
                WorkingDir: CONTAINER_WORKING_DIR,
                HostConfig: { Binds: binds, AutoRemove: true },
                AttachStdout: true, AttachStderr: true, Tty: false,
            };
            compileContainer = await docker.createContainer(compileContainerOptions);
            await compileContainer.start();
            
            const compilePromise = compileContainer.wait(); // No timeout on wait itself, rely on overall timeout
            const timeoutPromiseCompile = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Compilation Timeout")), DOCKER_EXECUTION_TIMEOUT_MS + 1000)
            );

            let compileExitData;
            try {
                compileExitData = await Promise.race([compilePromise, timeoutPromiseCompile]);
            } catch (e) {
                 if (e.message === "Compilation Timeout") {
                    result.errorType = 'Compilation Error'; // More specific than TLE for compile
                    result.message = `Compilation exceeded ${DOCKER_EXECUTION_TIMEOUT_MS / 1000}s.`;
                    result.duration = Date.now() - startTime;
                    if(compileContainer) await compileContainer.stop().catch(()=>{});
                    await cleanupTempDir(tempDirInfo.tempDirOnHost);
                    return result;
                 }
                 throw e;
            }
            
            if (compileExitData.StatusCode !== 0) {
                const compileLogs = await compileContainer.logs({ stdout: true, stderr: true, tail: 100 });
                const compileLogString = compileLogs ? compileLogs.toString('utf-8').substring(8) : "Compilation failed";
                result.errorType = 'Compilation Error';
                result.message = compileLogString.trim() || `Compilation failed with exit code ${compileExitData.StatusCode}.`;
                result.duration = Date.now() - startTime;
                await cleanupTempDir(tempDirInfo.tempDirOnHost);
                return result;
            }
            console.log(`[JudgeWorker] Compilation successful for ${mainFileName}.`);
        }
        
        console.log(`[JudgeWorker] Running ${language} code (${mainFileName})...`);
        const runContainerOptions = {
            Image: spec.image,
            Cmd: spec.runCmd(spec.compileCmd ? spec.executableFileName : mainFileName),
            WorkingDir: CONTAINER_WORKING_DIR,
            HostConfig: { 
                Binds: binds, 
                AutoRemove: true,
                Memory: 256 * 1024 * 1024,      // 256MB RAM limit
                NanoCpus: 1 * 1000000000,     // 1 CPU core equivalent
                // PidsLimit: 64, //限制进程/线程数
            },
            AttachStdin: true, AttachStdout: true, AttachStderr: true,
            OpenStdin: true, StdinOnce: false, Tty: false,
        };
        runContainer = await docker.createContainer(runContainerOptions);

        const stream = await runContainer.attach({ stream: true, stdin: true, stdout: true, stderr: true });
        
        if (inputText && typeof inputText === 'string') {
            stream.write(inputText + (inputText.endsWith('\n') ? '' : '\n'));
        }
        stream.end(); // Close stdin to signal end of input

        await runContainer.start();
        
        const runPromise = runContainer.wait(); // No timeout on wait itself
        const runTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Execution Timeout")), DOCKER_EXECUTION_TIMEOUT_MS)
        );
        
        let runExitData;
         try {
            runExitData = await Promise.race([runPromise, runTimeoutPromise]);
        } catch (e) {
             if (e.message === "Execution Timeout") {
                result.errorType = 'Time Limit Exceeded';
                result.message = `Execution exceeded ${DOCKER_EXECUTION_TIMEOUT_MS / 1000}s.`;
                result.duration = Date.now() - startTime;
                if(runContainer) await runContainer.stop().catch(()=>{}); // Attempt to stop the timed-out container
                await cleanupTempDir(tempDirInfo.tempDirOnHost);
                return result;
             }
             throw e;
        }

        const logBuffer = await runContainer.logs({ stdout: true, stderr: true, tail: 200 }); // Get last N lines
        if (logBuffer) {
            let logOutput = ""; let logError = "";
            let offset = 0;
            while (offset < logBuffer.length) {
                if (logBuffer.length < offset + 8) break;
                const type = logBuffer[offset];
                const length = logBuffer.readUInt32BE(offset + 4);
                offset += 8;
                if (logBuffer.length < offset + length) break; // Sanity check
                const content = logBuffer.subarray(offset, offset + length).toString('utf-8');
                if (type === 1) logOutput += content;
                if (type === 2) logError += content;
                offset += length;
            }
            result.stdout = logOutput;
            result.stderr = logError;
        }
        
        result.duration = Date.now() - startTime;

        if (runExitData.StatusCode !== 0) {
            result.errorType = 'Runtime Error';
            result.message = result.stderr.trim() || `Runtime error with exit code ${runExitData.StatusCode}.`;
        }

    } catch (err) {
        result.duration = Date.now() - startTime;
        if (err.message && (err.message.includes("Timeout") || err.message.includes("timeout"))) {
            result.errorType = 'Time Limit Exceeded'; // Should be caught by Promise.race
            result.message = err.message;
        } else {
            result.errorType = 'System Error';
            result.message = `Judge System Docker execution failed: ${err.message}`;
            console.error("[JudgeWorker] Dockerode Error:", err);
        }
    } finally {
        await cleanupTempDir(tempDirInfo?.tempDirOnHost);
    }
    return result;
}


// ---- 辅助函数：API通信 ----
async function fetchNextSubmission() {
    try {
        const response = await axios.get(`${API_BASE_URL}/submissions/next_to_judge`);
        // 主应用API在没有待处理任务时返回 { msg: "No pending submissions to judge." } 和 200 OK
        if (response.data && response.data._id) {
            return response.data;
        }
        // console.log("[JudgeWorker] No pending submissions found.");
        return null;
    } catch (error) {
        if (error.response && error.response.status === 404) {
             console.error(`[JudgeWorker] API endpoint for fetching submissions not found (404): ${API_BASE_URL}/submissions/next_to_judge. Is the main server running and URL correct?`);
        } else if (error.response && error.response.data && error.response.data.msg === "No pending submissions to judge.") {
             // This case should be handled by the success check above
        }
        else {
            console.error('[JudgeWorker] Error fetching next submission:', error.message);
        }
        return null;
    }
}

async function reportResult(submissionId, status, outputDetail = null, errorMsg = null) {
    try {
        await axios.post(`${API_BASE_URL}/submission/${submissionId}/judge_result`, {
            status: status,
            output: outputDetail, 
            error: errorMsg, 
        });
        console.log(`[JudgeWorker] Reported result for ${submissionId}: ${status}`);
    } catch (error) {
        const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[JudgeWorker] Error reporting result for ${submissionId}: ${errMsg}`);
    }
}

// ---- 测评和轮询逻辑 ----
async function processSubmission(submission) {
    console.log(`[JudgeWorker] Processing submission: ${submission._id} for problem: ${submission.problem.problem_id} (lang: ${submission.language})`);
    const { code, language, problem: problemDetails } = submission;
    // problem.examples 包含测试用例
    const testCases = problemDetails.examples; 

    let overallStatus = 'Accepted';
    let firstFailedDetail = "";

    if (!testCases || testCases.length === 0) {
        console.log(`[JudgeWorker] No test cases for problem ${problemDetails.problem_id}.`);
        await reportResult(submission._id, 'System Error', 'No test cases found for the problem.');
        return;
    }

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`  [JudgeWorker] Running TC ${i + 1}/${testCases.length} for sub ${submission._id}`);
        const runResult = await runInDocker(language, code, testCase.input);

        if (runResult.errorType) {
            overallStatus = runResult.errorType;
            firstFailedDetail = runResult.message || runResult.stderr || 'Execution failed.';
            console.log(`  [JudgeWorker] TC ${i+1} Failed: ${overallStatus} - ${firstFailedDetail.substring(0, 200)}...`);
            break; 
        }
        
        const actualOutput = runResult.stdout.replace(/\r\n/g, '\n').trimEnd();
        const expectedOutput = testCase.output.replace(/\r\n/g, '\n').trimEnd();

        if (actualOutput !== expectedOutput) {
            overallStatus = 'Wrong Answer';
            firstFailedDetail = `Test Case ${i + 1} Failed.\nExpected:\n'''\n${expectedOutput}\n'''\nGot:\n'''\n${actualOutput}\n'''`;
            console.log(`  [JudgeWorker] TC ${i+1} Wrong Answer.`);
            break;
        }
        console.log(`  [JudgeWorker] TC ${i+1} Passed.`);
    }
    
    console.log(`[JudgeWorker] Finished processing sub ${submission._id}. Final Status: ${overallStatus}`);
    await reportResult(submission._id, overallStatus, (overallStatus !== 'Accepted') ? firstFailedDetail : null);
}

async function mainLoop() {
    console.log('[JudgeWorker] Judge worker started. Polling for submissions...');
    await ensureBaseTempDir(); //确保临时目录基础路径存在
    while (true) {
        const submission = await fetchNextSubmission();
        if (submission) {
            // 确保 submission 对象和其 problem 嵌套对象存在，以及 problem.examples 存在
            if (!submission.problem || !submission.problem.examples) {
                console.error(`[JudgeWorker] Submission ${submission._id} is missing critical problem data (problem or examples). Reporting system error.`);
                await reportResult(submission._id, 'System Error', 'Problem data or test cases missing in fetched submission.');
                continue; 
            }
            try {
                await processSubmission(submission);
            } catch (e) {
                console.error(`[JudgeWorker] Unhandled critical error during processing submission ${submission._id}:`, e);
                await reportResult(submission._id, 'System Error', `Judge worker unhandled exception: ${e.message}`);
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        }
    }
}

// ---- 运行测评服务 ----
if (require.main === module) {
    docker.ping((err, data) => {
        if (err) {
            console.error("[JudgeWorker] Docker daemon is not running or not accessible.", err);
            console.error("[JudgeWorker] Please ensure Docker is installed, running, and the current user has permissions to access it.");
            process.exit(1);
        } else {
            console.log("[JudgeWorker] Docker daemon ping successful.");
            mainLoop().catch(criticalError => {
                console.error("[JudgeWorker] Judge worker failed critically:", criticalError);
                process.exit(1);
            });
        }
    });
}