import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import SearchBar from '@/features/search/SearchBar'
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

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
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
        <Tabs variant="solid-rounded" colorScheme="blue" size="lg">
          <HStack alignItems="flex-start">
            <TabList>
              <VStack>
                <Tab>Featured</Tab>
                <Tab>Latest</Tab>
              </VStack>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Session title="feature"></Session>
              </TabPanel>
              <TabPanel>
                <Session title="recent"></Session>
              </TabPanel>
            </TabPanels>
          </HStack>
        </Tabs>
      </Center>
    </>
  )
}
