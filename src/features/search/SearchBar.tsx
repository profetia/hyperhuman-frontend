import { Input, Flex, Box, Heading } from '@chakra-ui/react'

export default function SearchBar() {
  return (
    <Box mt={20}>
      <Flex justify="center">
        <Heading>Hyperhuman</Heading>
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
