import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  VStack,
  Center,
} from '@chakra-ui/react'
import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import SearchBar from '@/components/search-bar'
import CardSession from '@/components/card-session'
import NavBar from '@/components/navbar'
import HomeProvider from '@/contexts/home'

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
      <HomeProvider>
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
                  <CardSession title="Featured"></CardSession>
                </TabPanel>
                <TabPanel>
                  <CardSession title="Latest"></CardSession>
                </TabPanel>
              </TabPanels>
            </HStack>
          </Tabs>
        </Center>
      </HomeProvider>
    </>
  )
}
