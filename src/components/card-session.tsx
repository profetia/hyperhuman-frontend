import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Box,
  Heading,
  Flex,
} from '@chakra-ui/react'
import ThumbnailCard from './thumbnail-card'

const CardSession = () => {
  return (
    <Box>
      <Heading as="h5" size="md">
        Features
      </Heading>
      <Flex className="card-session">
        <ThumbnailCard></ThumbnailCard>
        <ThumbnailCard></ThumbnailCard>
        <ThumbnailCard></ThumbnailCard>
        <ThumbnailCard></ThumbnailCard>
        <ThumbnailCard></ThumbnailCard>
      </Flex>
    </Box>
  )
}

export default CardSession
