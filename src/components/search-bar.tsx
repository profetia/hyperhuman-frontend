import { Input, Flex, Box, Heading } from '@chakra-ui/react'

const SearchBar = () => {
  return (
    <Box mt={20}>
      <Flex justify="center">
        <Heading as="h1">Hyperhuman</Heading>
      </Flex>
      <Flex justify="center" mt={10}>
        <Box width={600}>
          <Input
            placeholder="Search"
            size="lg"
            variant="filled"
            _focus={{
              borderColor: 'teal.500',
            }}
          />
        </Box>
      </Flex>
    </Box>
  )
}

export default SearchBar
