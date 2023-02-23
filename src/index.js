import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { RecoilRoot, useRecoilValue } from 'recoil'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ErrorPage } from './components/ErrorPage'
import { ResultBoard } from './components/ResultBoard'
import { logInfoAtom } from './components/Header'

const root = ReactDOM.createRoot(document.getElementById('root'))

function Outter() {
	const logInfo = useRecoilValue(logInfoAtom)
	const router = createBrowserRouter([
		{
			path: '/',
			element: <App />,
			errorElement: <ErrorPage />,
			children: logInfo //路由守卫
				? [
						{
							path: 'result',
							element: <ResultBoard />,
						},
				  ]
				: [],
		},
	])
	return <RouterProvider router={router} />
}

root.render(
	<React.StrictMode>
		<RecoilRoot>
			<Outter />
		</RecoilRoot>
	</React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
