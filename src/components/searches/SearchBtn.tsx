import { doGetSearchResult } from '@/api/task'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { setCurrentSection, setSearchSessions } from '@/stores/task/section'
import { Button } from '@chakra-ui/react'

interface Props {
  prelude: string
}

export default function SearchBtn(props: Props) {
  const dispatch = useAppDispatch()

  const onClick = () => {
    if (props.prelude) {
      dispatch(async (dispatch, getState) => {
        const searchResult = await doGetSearchResult(props.prelude)
        dispatch(setSearchSessions(searchResult))
        dispatch(setCurrentSection('search'))
      })
    }
  }

  return (
    <Button colorScheme="blue" width={20} onClick={onClick}>
      Search
    </Button>
  )
}
