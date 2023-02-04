import {
  Input,
  Flex,
  Box,
  Heading,
  Button,
  ButtonGroup,
  VStack,
} from '@chakra-ui/react'

const SearchBar = () => {
  return (
    <Box mt={20}>
      <Flex justify="center">
        <Heading as="h1">DreamFace</Heading>
      </Flex>
      <VStack>
        <Flex justify="center" mt={10}>
          <Box width={600}>
            <Input
              placeholder="Describe the model you want to generate"
              size="lg"
              variant="filled"
              _focus={{
                borderColor: 'teal.500',
              }}
            />
          </Box>
        </Flex>
        <ButtonGroup mx={3}>
          <Button colorScheme="blue" width={20}>
            Search
          </Button>
          <Button colorScheme="blue" width={20}>
            Generate
          </Button>
        </ButtonGroup>
      </VStack>
    </Box>
  )
}

export default SearchBar
