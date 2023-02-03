import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Box,
  Heading,
  Flex,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import ThumbnailCard from './thumbnail-card'

const CardSession = () => {
  return (
    <Flex justify="center">
      <Box>
        <Heading as="h3" size="md" mb="5">
          Features
        </Heading>
        <Wrap spacing="24px" maxW="1200px">
          <WrapItem>
            <ThumbnailCard></ThumbnailCard>
          </WrapItem>
          <WrapItem>
            <ThumbnailCard></ThumbnailCard>
          </WrapItem>
          <WrapItem>
            <ThumbnailCard></ThumbnailCard>
          </WrapItem>
          <WrapItem>
            <ThumbnailCard></ThumbnailCard>
          </WrapItem>
          <WrapItem>
            <ThumbnailCard></ThumbnailCard>
          </WrapItem>
          <WrapItem>
            <ThumbnailCard></ThumbnailCard>
          </WrapItem>
        </Wrap>
      </Box>
    </Flex>
  )
}

export default CardSession
