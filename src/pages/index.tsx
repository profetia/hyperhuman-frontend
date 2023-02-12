import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import SearchBar from '@/components/searches/SearchBar'
import Session from '@/components/cards/Section'
import {
  Center,
  HStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
} from '@chakra-ui/react'
import NavBar from '@/components/navigators/NavBar'
import { useEffect } from 'react'
import { initTaskSessions } from '@/stores/task/section'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { mockTaskCardResponse } from '@/api/restful/task/cards'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const section = useAppSelector((state) => state.section)
  const user = useAppSelector((state) => state.user)

  const dispatch = useAppDispatch()

  useEffect(() => {
    if (
      section.taskSessions.feature.length > 0 &&
      section.taskSessions.recent.length > 0
    ) {
      return
    }

    dispatch(
      initTaskSessions({
        feature: mockTaskCardResponse,
        recent: mockTaskCardResponse,
        author: mockTaskCardResponse,
      })
    )
  })

  return (
    <>
      <Head>
        <title>DreamFace</title>
        <meta name="description" content="Hyperhuman" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NavBar {...user.profile}></NavBar>
      <SearchBar></SearchBar>
      <Center mt={10}>
        <Tabs variant="solid-rounded" colorScheme="blue" size="lg">
          <HStack alignItems="flex-start">
            <TabList>
              <VStack>
                <Tab>Feature</Tab>
                <Tab>Recent</Tab>
                {section.currentSection === 'search' && <Tab>Search</Tab>}
              </VStack>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Session title="feature"></Session>
              </TabPanel>
              <TabPanel>
                <Session title="recent"></Session>
              </TabPanel>
              <TabPanel>
                <Session title="search"></Session>
              </TabPanel>
            </TabPanels>
          </HStack>
        </Tabs>
      </Center>
    </>
  )
}
