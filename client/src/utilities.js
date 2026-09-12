/**
 * Utility functions to make API requests.
 * By importing this file, you can use the provided get and post functions.
 * You shouldn't need to modify this file, but if you want to learn more
 * about how these functions work, google search "Fetch API"
 *
 * These functions return promises, which means you should use ".then" on them.
 * e.g. get('/api/foo', { bar: 0 }).then(res => console.log(res))
 */

// ex: formatParams({ some_key: "some_value", a: "b"}) => "some_key=some_value&a=b"
function formatParams(params) {
  // iterate of all the keys of params as an array,
  // map it to a new array of URL string encoded key,value pairs
  // join all the url params using an ampersand (&).
  return Object.keys(params)
    .map((key) => key + "=" + encodeURIComponent(params[key]))
    .join("&");
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Convert a fetch result to JSON while preserving useful server error details.
async function convertToJSON(res) {
  const text = await res.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_error) {
      if (!res.ok) {
        throw new ApiError(
          `API request failed with response status ${res.status}: ${text}`,
          res.status,
          null
        );
      }
      throw new Error(`API response could not be converted to JSON: ${text}`);
    }
  }

  if (!res.ok) {
    throw new ApiError(
      data?.msg || `API request failed with response status ${res.status}`,
      res.status,
      data
    );
  }

  return data;
}

// Helper code to make a get request. Default parameter of empty JSON Object for params.
// Returns a Promise to a JSON Object.
export async function get(endpoint, params = {}) {
  const query = formatParams(params);
  const fullPath = query ? `${endpoint}?${query}` : endpoint;
  try {
    const res = await fetch(fullPath);
    return convertToJSON(res);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`GET request to ${fullPath} failed: ${error.message || error}`);
  }
}

// Helper code to make a post request. Default parameter of empty JSON Object for params.
// Returns a Promise to a JSON Object.
export async function post(endpoint, params = {}) {
  const isFormData = params instanceof FormData;
  try {
    const res = await fetch(endpoint, {
      method: "post",
      headers: isFormData ? {} : { "Content-type": "application/json" },
      body: isFormData ? params : JSON.stringify(params),
    });
    return convertToJSON(res);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`POST request to ${endpoint} failed: ${error.message || error}`);
  }
}
