import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App.jsx";
import NotFound from "./components/pages/NotFound";
import Home from "./components/pages/Home.jsx";
import Dashboard from "./components/pages/Dashboard.jsx";
import Problems from "./components/pages/Problems.jsx";
import ProblemDetailPage from "./components/pages/ProblemDetailPage.jsx";
import AddProblemPage from "./components/pages/AddProblemPage.jsx";
import ProfilePage from "./components/pages/ProfilePage.jsx"; // Import ProfilePage
import QuerySubmission from "./components/pages/QuerySubmissionPage.jsx";
import { LoginPage, RegisterPage } from "./components/pages/LoginRegister.jsx";
import { AuthProvider } from "./auth";

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
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<NotFound />} />
    </>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
