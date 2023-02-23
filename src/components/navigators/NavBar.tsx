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
import { UserProfile } from '@/models/user/profile'
import { useAppSelector } from '@/hooks'

function getLogo(colorMode: string) {
  switch (colorMode) {
    case 'dark':
      return '/deemos.png'
    default:
      return '/deemos-dark.png'
  }
}

export default function NavBar() {
  const { colorMode, toggleColorMode } = useColorMode()
  const { isLogin, profile } = useAppSelector((state) => state.user)

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
                <MenuButton rounded="full" cursor="pointer">
                  <Avatar size="sm" src={profile.avatar} />
                </MenuButton>
                <MenuList alignItems={'center'}>
                  <br />
                  <Center>
                    <Avatar size={'2xl'} src={profile.avatar} />
                  </Center>
                  <br />
                  <Center>
                    <p>{profile.name}</p>
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
