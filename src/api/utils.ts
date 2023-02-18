import axios, { AxiosRequestConfig } from 'axios'
import process from 'process'

export async function GET(uri: string, options?: AxiosRequestConfig) {
  return await axios.get(
    `${process.env.NEXT_PUBLIC_API_BASE as string}${uri}`,
    options
  )
}

export async function POST(
  uri: string,
  data?: unknown,
  options?: AxiosRequestConfig
) {
  return await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE as string}${uri}`,
    data,
    options
  )
}
