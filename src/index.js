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


const root = ReactDOM.createRoot(document.getElementById("root"));

function Outter() {
  const router = createBrowserRouter([
    {
      path: "*",
      element: <App />,
      errorElement: <ErrorPage />,
    },
    {
      path: "*",
      element: <ErrorPage />,
    },
  ]);
  return <RouterProvider router={router} />;
}

root.render(
  <div className="root">
    <div className="container">
      <React.StrictMode>
        <RecoilRoot>
          <Outter />
        </RecoilRoot>
      </React.StrictMode>
    </div>
  </div>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
