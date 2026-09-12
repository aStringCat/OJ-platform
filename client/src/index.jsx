// client/src/index.jsx

import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App.jsx";
import NotFound from "./components/pages/NotFound";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { AuthProvider } from "./auth";

const Home = lazy(() => import("./components/pages/Home.jsx"));
const Dashboard = lazy(() => import("./components/pages/Dashboard.jsx"));
const Problems = lazy(() => import("./components/pages/Problems.jsx"));
const ProblemDetailPage = lazy(() => import("./components/pages/ProblemDetailPage.jsx"));
const AddProblemPage = lazy(() => import("./components/pages/AddProblemPage.jsx"));
const ProfilePage = lazy(() => import("./components/pages/ProfilePage.jsx"));
const QuerySubmission = lazy(() => import("./components/pages/QuerySubmissionPage.jsx"));
const SubmissionDetailPage = lazy(() => import("./components/pages/SubmissionDetailPage.jsx"));
const AuthPage = lazy(() =>
  import("./components/pages/LoginRegister.jsx").then((module) => ({ default: module.AuthPage }))
);

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route errorElement={<NotFound />} element={<App />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/problem/:problemId" element={<ProblemDetailPage />} />
        <Route path="/add-problem" element={<AddProblemPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/submissions" element={<QuerySubmission />} />
        <Route path="/submission/:submissionId" element={<SubmissionDetailPage />} />
      </Route>
      <Route path="/login" element={<AuthPage />} />
      <Route path="*" element={<NotFound />} />
    </>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  </StrictMode>
);
