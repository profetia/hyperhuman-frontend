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
import { useEffect, useState } from 'react'
import { initTaskSessions } from '@/stores/task/section'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { doGetTaskCards } from '@/api/task'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const section = useAppSelector((state) => state.section)
  const user = useAppSelector((state) => state.user)

  const dispatch = useAppDispatch()

  useEffect(() => {
    if (
      section.taskSessions.feature.length > 0 ||
      section.taskSessions.recent.length > 0
    ) {
      return
    }

    const fetchInitialTaskSessions = async () => {
      const initialFeatureSessions = await doGetTaskCards(1, 'feature')
      const initialRecentSessions = await doGetTaskCards(1, 'recent')
      const initialAuthorSessions = await (async () => {
        if (user.isLogin) {
          return await doGetTaskCards(1, 'author')
        } else {
          return []
        }
      })()

      dispatch(
        initTaskSessions({
          feature: initialFeatureSessions,
          recent: initialRecentSessions,
          author: initialAuthorSessions,
        })
      )
    }

    fetchInitialTaskSessions()
  })

  const [tabIndex, setTabIndex] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (section.currentSection === 'search') {
      setTabIndex(3)
    }
  }, [section.currentSection])

  return (
    <>
      <Head>
        <title>DreamFace</title>
        <meta name="description" content="Hyperhuman" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NavBar></NavBar>
      <SearchBar></SearchBar>
      <Center mt={10}>
        <Tabs
          variant="solid-rounded"
          colorScheme="blue"
          size="lg"
          index={tabIndex}
        >
          <HStack alignItems="flex-start">
            <TabList>
              <VStack>
                <Tab>Feature</Tab>
                <Tab>Recent</Tab>
                {user.isLogin && <Tab>Author</Tab>}
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
                <Session title="author"></Session>
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
