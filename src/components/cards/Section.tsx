import { SectionType } from '@/api/restful/task/cards'
import { Box, Wrap, WrapItem } from '@chakra-ui/react'
import ThumbnailCard from '@/components/cards/Thumbnil'
import { SectionState } from '@/stores/task/section'
import { useAppSelector } from '@/hooks'

type Props = {
  title: SectionType | 'search'
}

export default function Session({ title }: Props) {
  const section: SectionState = useAppSelector((state) => state.sectionReducer)

  return (
    <Box>
      <Wrap spacing="24px" maxW="900px">
        {section.taskSessions[title].map((session, index) => (
          <WrapItem key={index}>
            <ThumbnailCard
              {...{
                ...session,
                onLike: () => {},
              }}
            ></ThumbnailCard>
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  )
}
