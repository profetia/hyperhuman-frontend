import { SectionType } from '@/api/restful/task/cards'
import { Box, Flex, Wrap, WrapItem } from '@chakra-ui/react'
import ThumbnailCard from '@/components/cards/Thumbnil'

type Props = {
  title: SectionType | 'search'
}

export default function Session({ title }: Props) {
  return (
    <Box>
      <Flex>
        <ThumbnailCard></ThumbnailCard>
        <ThumbnailCard></ThumbnailCard>
        <ThumbnailCard></ThumbnailCard>
        <ThumbnailCard></ThumbnailCard>
        <ThumbnailCard></ThumbnailCard>
      </Flex>
    </Box>
  )
}
