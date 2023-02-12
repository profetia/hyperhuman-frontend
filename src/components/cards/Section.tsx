import { SectionType } from '@/api/restful/task/cards'
import { Box, Wrap, WrapItem } from '@chakra-ui/react'
import ThumbnailCard from '@/components/cards/Thumbnil'
import { giveALike, SectionState } from '@/stores/task/section'
import { useAppDispatch, useAppSelector } from '@/hooks'

type Props = {
  title: SectionType | 'search'
}

export default function Session({ title }: Props) {
  const section: SectionState = useAppSelector((state) => state.section)
  const dispatch = useAppDispatch()

  return (
    <Box>
      <Wrap spacing="24px" maxW="900px">
        {section.taskSessions[title].map((session, index) => (
          <WrapItem key={index}>
            <ThumbnailCard
              {...{
                ...session,
                onLike: () => {
                  dispatch(
                    giveALike({
                      collection: title,
                      index: index,
                      target: !session.is_liked,
                    })
                  )
                },
              }}
            ></ThumbnailCard>
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  )
}
