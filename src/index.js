import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { RecoilRoot } from "recoil";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorPage } from "./components/ErrorPage";
import {
  DetailBoard,
  GenerateBoard,
  ResultBoard,
} from "./components/ResultBoard";
import Login from "./Login";
import Register from "./Register";
import ResetPassword from "./ResetPassword";
import UpdatePassword from "./UpdatePassword";

const root = ReactDOM.createRoot(document.getElementById("root"));

function Outter() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <App />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "result",
          element: <ResultBoard />,
          children: [
            {
              path: "detail/:task_uuid",
              element: <DetailBoard />,
            },
            {
              path: "generate",
              element: <GenerateBoard />,
            },
          ],
        },
      ],
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
    },
    {
      path: "/update-password",
      element: <UpdatePassword />,
    },
    {
      path: "*",
      element: <ErrorPage />,
    },
  ]);
  return <RouterProvider router={router} />;
}

root.render(
  <React.StrictMode>
    <RecoilRoot>
      <Outter />
    </RecoilRoot>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
