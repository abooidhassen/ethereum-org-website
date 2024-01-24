import { useRef, useState } from "react"
import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"
import {
  Box,
  Flex,
  forwardRef,
  Input,
  Menu,
  MenuItem,
  type MenuItemProps,
  MenuList,
  type MenuListProps,
  type MenuProps,
  Progress,
  Text,
} from "@chakra-ui/react"

import { BaseLink, LinkProps } from "@/components/Link"

import progressData from "@/data/translationProgress.json"

import { DEFAULT_LOCALE } from "@/lib/constants"

import i18nConfig from "@/../i18n.config.json"

type LocaleDisplayInfo = {
  localeChoice: string
  source: string
  target: string
  approvalProgress: number
}

type ItemProps = MenuItemProps & Pick<LinkProps, "href" | "locale" | "onClick">

const Item = forwardRef(({ onClick, ...props }: ItemProps, ref) => (
  <MenuItem
    as={BaseLink}
    ref={ref}
    flexDir="column"
    w="full"
    onClick={onClick}
    alignItems="start"
    borderRadius="base"
    bg="transparent"
    color="body.base"
    textDecoration="none"
    data-group
    _hover={{ bg: "background.base", textDecoration: "none" }}
    _focus={{ bg: "background.base" }}
    sx={{
      p: {
        textDecoration: "none",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    }}
    {...props}
  />
))

type LanguagePickerProps = Omit<MenuListProps, "children"> & {
  children: React.ReactNode
  placement: MenuProps["placement"]
  handleClose?: () => void
}
const LanguagePicker = ({
  children,
  placement,
  handleClose,
  ...props
}: LanguagePickerProps) => {
  const { t } = useTranslation("page-languages")
  const router = useRouter()
  const { asPath, locale, locales } = router
  const inputRef = useRef<HTMLInputElement>(null)
  const firstItemRef = useRef<HTMLAnchorElement>(null)
  const [filterValue, setFilterValue] = useState("")

  const displayNames: LocaleDisplayInfo[] =
    locales
      ?.map((localeChoice): LocaleDisplayInfo => {
        const i18nConfigItem = i18nConfig.find(
          ({ code }) => localeChoice === code
        )
        if (!i18nConfigItem)
          throw new Error("Missing i18n config for " + localeChoice)

        // Get "source" display name (Language choice displayed in language of current locale)
        const intlSource = new Intl.DisplayNames([locale!], {
          type: "language",
        }).of(localeChoice)
        // For languages that do not have an Intl display name, use English name as fallback
        const fallbackSource =
          intlSource !== localeChoice ? intlSource : i18nConfigItem.name
        const i18nKey = "language-" + localeChoice.toLowerCase()
        const i18nSource = t(i18nKey)
        const source = i18nSource === i18nKey ? fallbackSource : i18nSource

        // Get "target" display name (Language choice displayed in that language)
        const fallbackTarget = new Intl.DisplayNames([localeChoice], {
          type: "language",
        }).of(localeChoice)
        const i18nConfigTarget = i18nConfigItem?.localName
        const target = i18nConfigTarget || fallbackTarget

        if (!source || !target) {
          throw new Error(
            "Missing language display name, locale: " + localeChoice
          )
        }

        const dataItem = progressData.find(
          ({ languageId }) => i18nConfigItem.crowdinCode === languageId
        )
        const approvalProgress =
          dataItem?.approvalProgress ||
          (localeChoice === DEFAULT_LOCALE ? 100 : 0)

        return { localeChoice, source, target, approvalProgress }
      })
      .sort((a, b) => b.approvalProgress - a.approvalProgress) || []

  const filteredNames = displayNames.filter(
    ({ localeChoice, source, target }) =>
      (localeChoice + source + target)
        .toLowerCase()
        .includes(filterValue.toLowerCase())
  )

  return (
    <Menu
      isLazy
      initialFocusRef={inputRef}
      placement={placement}
      closeOnSelect={false}
    >
      {({ onClose }) => {
        const onMenuClose = () => {
          handleClose ? handleClose() : onClose()
        }
        return (
          <>
            {children}
            <MenuList
              position="relative"
              overflow="auto"
              borderRadius="none"
              p="4"
              bg="primary.lowContrast"
              {...props}
            >
              {/* TODO: Implement highlighted locale(s) */}
              {/* <Text fontSize="xs" color="body.medium">
                Last language used
              </Text>
              <Item
                key="item-en"
                href={asPath}
                locale="en"
                onClick={onMenuClose}
              >
                <Text fontSize="lg" color="body.base">
                  {
                    displayNames.find(
                      ({ localeChoice }) => localeChoice === DEFAULT_LOCALE
                    )?.target
                  }
                </Text>
                <Text
                  textTransform="uppercase"
                  fontSize="xs"
                  color="body.medium"
                >
                  {
                    displayNames.find(
                      ({ localeChoice }) => localeChoice === DEFAULT_LOCALE
                    )?.source
                  }
                </Text>
              </Item>
              <MenuDivider borderColor="body.medium" my="4" /> */}

              <Text fontSize="xs" color="body.medium">
                Filter list ({filteredNames.length} languages)
              </Text>
              <MenuItem
                onFocus={() => inputRef.current?.focus()}
                p="0"
                bg="transparent"
                position="relative"
                pointerEvents="none"
              >
                <Box
                  position="absolute"
                  inset="0"
                  zIndex="docked"
                  pointerEvents="auto"
                  cursor="text"
                  onClick={(e) => e.stopPropagation()}
                />
                <Input
                  placeholder="Type to filter"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  ref={inputRef}
                  h="8"
                  mt="1"
                  mb="2"
                  bg="background.base"
                  color="body.base"
                  onKeyDown={(e) => {
                    // If Enter, navigate to first result
                    if (e.key === "Enter") {
                      e.preventDefault()
                      firstItemRef.current?.click()
                    }
                    // If ArrowDown, move focus to first result
                    if (e.key === "ArrowDown") {
                      e.preventDefault()
                      firstItemRef.current?.focus()
                    }
                  }}
                />
              </MenuItem>
              {filteredNames.map(
                ({ localeChoice, source, target, approvalProgress }, index) => {
                  const firstResult = index === 0
                  return (
                    <Item
                      key={"item-" + localeChoice}
                      href={asPath}
                      locale={localeChoice}
                      ref={firstResult ? firstItemRef : null}
                      onClick={onMenuClose}
                    >
                      <Flex justifyContent="space-between" w="full">
                        <Text fontSize="lg" color="body.base">
                          {target}
                        </Text>
                      </Flex>
                      <Text
                        textTransform="uppercase"
                        fontSize="xs"
                        color="body.medium"
                      >
                        {source} ·{" "}
                        <Text as="span" textTransform="capitalize">
                          {new Intl.NumberFormat(locale!, {
                            style: "percent",
                          }).format(approvalProgress / 100)}{" "}
                          translated
                        </Text>
                      </Text>
                      <Progress
                        value={approvalProgress}
                        h="0.5"
                        mt="1"
                        w="full"
                        borderRadius="none"
                        bg="background.base"
                        sx={{ "&>div": { backgroundColor: "primary.highContrast" } }}
                      />
                    </Item>
                  )
                }
              )}
            </MenuList>
          </>
        )
      }}
    </Menu>
  )
}

export default LanguagePicker