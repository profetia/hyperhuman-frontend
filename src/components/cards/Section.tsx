import { SectionType } from '@/api/restful/task/cards'
import { Box, Wrap, WrapItem } from '@chakra-ui/react'
import ThumbnailCard from '@/components/cards/Thumbnil'

type Props = {
  title: SectionType | 'search'
}

export default function Session({ title }: Props) {
  return (
    <Box>
      <Wrap spacing="24px" maxW="900px">
        <WrapItem>
          <ThumbnailCard></ThumbnailCard>
        </WrapItem>
      </Wrap>
    </Box>
  )
}
