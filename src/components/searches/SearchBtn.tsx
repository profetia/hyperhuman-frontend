import { Button } from '@chakra-ui/react'

interface Props {
  prelude: string
}

export default function SearchBtn(props: Props) {
  return (
    <Button colorScheme="blue" width={20}>
      Search
    </Button>
  )
}
