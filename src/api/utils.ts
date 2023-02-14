import axios from 'axios'
import process from 'process'

export async function GET(uri: string) {
  return await axios.get(`${process.env.NEXT_PUBLIC_API_BASE as string}${uri}`)
}

export async function POST(uri: string, data: any, options?: any) {
  return await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE as string}/${uri}`,
    data,
    options
  )
}
