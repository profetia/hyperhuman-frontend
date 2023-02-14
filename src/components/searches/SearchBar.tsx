import {
  Input,
  InputGroup,
  InputRightElement,
  Flex,
  Box,
  Heading,
  ButtonGroup,
  VStack,
  IconButton,
} from '@chakra-ui/react'
import GenerateBtn from '@/components/searches/GenerateBtn'
import SearchBtn from '@/components/searches/SearchBtn'

import { CgMicrobit } from 'react-icons/cg'
import { useState } from 'react'

export default function SearchBar() {
  const [prelude, setPrelude] = useState('')

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
                value={prelude}
                onChange={(e) => setPrelude(e.target.value)}
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
          <SearchBtn prelude={prelude}></SearchBtn>
          <GenerateBtn prelude={prelude}></GenerateBtn>
        </ButtonGroup>
      </VStack>
    </Box>
  )
}
