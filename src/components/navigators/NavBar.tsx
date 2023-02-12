import { ReactNode } from 'react'
import {
  Box,
  Flex,
  Avatar,
  Link,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Stack,
  useColorMode,
  Center,
  Image,
  Heading,
  HStack,
  Text,
} from '@chakra-ui/react'
import { IoMdMoon as MoonIcon, IoMdSunny as SunIcon } from 'react-icons/io'

const getLogo = (colorMode: string) => {
  switch (colorMode) {
    case 'dark':
      return '/deemos.png'
    default:
      return '/deemos-dark.png'
  }
}

export default function NavBar() {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <>
      <Box px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <HStack>
            <Image src={getLogo(colorMode)} alt="Deemos" height="40px" />
            <Text fontSize="2xl">-</Text>
            <Heading as="h2" size="md">
              HyperHuman Project
            </Heading>
          </HStack>

          <Flex alignItems={'center'}>
            <Stack direction={'row'} spacing={7}>
              <Button onClick={toggleColorMode}>
                {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              </Button>

              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                >
                  <Avatar
                    size={'sm'}
                    src={'https://avatars.dicebear.com/api/male/username.svg'}
                  />
                </MenuButton>
                <MenuList alignItems={'center'}>
                  <br />
                  <Center>
                    <Avatar
                      size={'2xl'}
                      src={'https://avatars.dicebear.com/api/male/username.svg'}
                    />
                  </Center>
                  <br />
                  <Center>
                    <p>Username</p>
                  </Center>
                  <br />
                  <MenuDivider />
                  <MenuItem>Your Servers</MenuItem>
                  <MenuItem>Account Settings</MenuItem>
                  <MenuItem>Logout</MenuItem>
                </MenuList>
              </Menu>
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  )
}
