import {
  Input,
  InputGroup,
  InputRightElement,
  Flex,
  Box,
  Heading,
  Button,
  ButtonGroup,
  VStack,
  IconButton,
} from '@chakra-ui/react'

import { CgMicrobit } from 'react-icons/cg'

const SearchBar = () => {
  return (
    <Box mt={20}>
      <Flex justify="center">
        <Heading as="h1">DreamFace</Heading>
      </Flex>
      <VStack>
        <Flex justify="center" mt={10}>
          <Box width={600}>
            <InputGroup>
              <Input
                placeholder="Describe the model you want to generate"
                size="lg"
                variant="filled"
                _focus={{
                  borderColor: 'teal.500',
                }}
              />
              <InputRightElement
                className="AIBtn"
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                }}
              >
                <IconButton
                  icon={<CgMicrobit />}
                  aria-label="AI assistant"
                  size="md"
                  variant="ghost"
                />
              </InputRightElement>
            </InputGroup>
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
