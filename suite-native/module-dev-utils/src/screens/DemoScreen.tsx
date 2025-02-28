import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { Link } from '@suite-native/link';
import {
    Text,
    Box,
    Hint,
    SearchInput,
    Radio,
    CheckBox,
    Switch,
    IconButton,
    InputWrapper,
    Input,
    VStack,
    Button,
    ButtonColorScheme,
    Divider,
    Badge,
    BadgeVariant,
    HStack,
    ButtonSize,
    TextButton,
    NumPadButton,
    TextButtonVariant,
    // Card,
    // ListItemSkeleton,
    AlertBox,
} from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { TypographyStyle } from '@trezor/theme';

const inputStackStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp8,
}));

const textVariants: TypographyStyle[] = [
    'titleLarge',
    'titleMedium',
    'titleSmall',
    'highlight',
    'body',
    'callout',
    'hint',
    'label',
];

const buttonSizes = ['small', 'medium', 'large'] satisfies ButtonSize[];

const flexWrapStyle = prepareNativeStyle(_ => ({
    flexWrap: 'wrap',
}));

export const DemoScreen = () => {
    const { applyStyle } = useNativeStyles();
    const [input2Text, setInput2Text] = useState<string>('');
    const [input3Text, setInput3Text] = useState<string>('sf51s4afsfwfs8f4');
    const [radioChecked, setRadioChecked] = useState<string>('second');
    const [isCheckBox1Checked, setIsCheckBox1Checked] = useState(false);
    const [isCheckBox2Checked, setIsCheckBox2Checked] = useState(true);
    const [isCheckBox3Checked, setIsCheckBox3Checked] = useState(false);
    const [isCheckBox4Checked, setIsCheckBox4Checked] = useState(true);
    const [isSwitchActive, setIsSwitchActive] = useState<boolean>(true);
    const [isSwitch2Active, setIsSwitch2Active] = useState<boolean>(false);
    const demoInputRef = useRef<TextInput | null>(null);

    const buttonColorSchemes = [
        'primary',
        'secondary',
        'tertiaryElevation0',
        'redBold',
        'redElevation0',
        'yellowBold',
        'yellowElevation0',
        'blueBold',
        'blueElevation0',
    ] satisfies ButtonColorScheme[];

    const textButtonVariants = ['primary', 'tertiary'] satisfies TextButtonVariant[];
    const badgeVariants = [
        'neutral',
        'green',
        'greenSubtle',
        'yellow',
        'red',
        'bold',
    ] satisfies BadgeVariant[];

    const handleRadioPress = (value: string | number) => {
        setRadioChecked(value.toString());
    };

    if (!isDevelopOrDebugEnv()) return null;

    return (
        <Screen screenHeader={<ScreenSubHeader />}>
            <VStack spacing="sp16">
                <VStack>
                    <Text variant="titleSmall">Badge:</Text>
                    <HStack justifyContent="center" style={applyStyle(flexWrapStyle)}>
                        {badgeVariants.map(badgeVariant => (
                            <Badge
                                key={badgeVariant}
                                variant={badgeVariant}
                                label={badgeVariant}
                                icon="question"
                                elevation="0"
                            />
                        ))}
                        <Badge key="disabled" label="disabled" icon="question" isDisabled />
                    </HStack>
                </VStack>
                <Divider />
                <VStack>
                    <Text variant="titleSmall">Text:</Text>
                    {textVariants.map(variant => (
                        <Text variant={variant} key={variant}>
                            {variant}
                        </Text>
                    ))}
                </VStack>
                <VStack>
                    <Text variant="titleSmall">Button:</Text>
                    {buttonColorSchemes.map(buttonScheme => (
                        <VStack key={buttonScheme}>
                            <Text>{buttonScheme}</Text>
                            <Box
                                flexDirection="row"
                                justifyContent="space-around"
                                alignItems="center"
                                style={applyStyle(flexWrapStyle)}
                            >
                                {buttonSizes.map(buttonSize => (
                                    <Button
                                        key={buttonSize}
                                        colorScheme={buttonScheme}
                                        viewLeft="calendar"
                                        size={buttonSize}
                                    >
                                        {buttonSize}
                                    </Button>
                                ))}
                            </Box>
                        </VStack>
                    ))}
                    <VStack>
                        <Text>Disabled</Text>
                        <Box
                            flexDirection="row"
                            justifyContent="space-around"
                            alignItems="center"
                            style={applyStyle(flexWrapStyle)}
                        >
                            {buttonSizes.map(buttonSize => (
                                <Button
                                    key={buttonSize}
                                    colorScheme="primary"
                                    viewLeft="calendar"
                                    size={buttonSize}
                                    isDisabled
                                >
                                    {buttonSize}
                                </Button>
                            ))}
                        </Box>
                    </VStack>
                </VStack>
                <Divider />
                <VStack>
                    <Text variant="titleSmall">IconButton:</Text>
                    {buttonColorSchemes.map(buttonScheme => (
                        <View key={buttonScheme}>
                            <Text>{buttonScheme}</Text>
                            <Box
                                flexDirection="row"
                                justifyContent="space-around"
                                alignItems="center"
                            >
                                {buttonSizes.map(buttonSize => (
                                    <IconButton
                                        key={buttonSize}
                                        colorScheme={buttonScheme}
                                        iconName="calendar"
                                        size={buttonSize}
                                    />
                                ))}
                            </Box>
                        </View>
                    ))}
                </VStack>
                <VStack>
                    <Text variant="titleSmall">TextButton:</Text>
                    {textButtonVariants.map(variant => (
                        <HStack
                            key={variant}
                            flexDirection="row"
                            justifyContent="space-around"
                            alignItems="center"
                        >
                            {buttonSizes.map(buttonSize => (
                                <TextButton
                                    variant={variant}
                                    key={variant + buttonSize}
                                    viewLeft="trezorSafe5"
                                    size={buttonSize}
                                >
                                    {buttonSize}
                                </TextButton>
                            ))}
                        </HStack>
                    ))}
                </VStack>
                <Divider />
                <Divider />
                <Box>
                    <SearchInput onChange={() => {}} placeholder="Type here.." />
                    <Box marginVertical="sp16">
                        <VStack style={applyStyle(inputStackStyle)} spacing="sp8">
                            <InputWrapper label="Recipient">
                                <Input
                                    ref={demoInputRef}
                                    value={input2Text}
                                    onChangeText={setInput2Text}
                                    label="To"
                                />
                            </InputWrapper>
                            <InputWrapper>
                                <Input
                                    value={input3Text}
                                    onChangeText={setInput3Text}
                                    label="From"
                                    leftIcon={<CryptoIcon symbol="btc" size="small" />}
                                    hasWarning
                                />
                            </InputWrapper>
                        </VStack>
                    </Box>
                    <Box marginVertical="sp16">
                        <VStack style={applyStyle(inputStackStyle)} spacing="sp8">
                            <InputWrapper hint="This input is not valid.">
                                <Input
                                    value={input2Text}
                                    onChangeText={setInput2Text}
                                    label="To"
                                    hasError
                                />
                            </InputWrapper>
                        </VStack>
                    </Box>
                    <Box marginTop="sp24">
                        <Text variant="titleLarge">Title Large</Text>
                    </Box>
                    <Box>
                        <Text variant="titleMedium">Title Medium</Text>
                    </Box>
                    <Switch
                        isChecked={isSwitchActive}
                        onChange={() => setIsSwitchActive(!isSwitchActive)}
                    />
                    <Switch
                        isChecked={isSwitch2Active}
                        onChange={() => setIsSwitch2Active(!isSwitch2Active)}
                        isDisabled
                    />
                    <Box marginVertical="sp16">
                        <Text>Icon:</Text>
                        <Icon name="warningCircle" size="large" />
                    </Box>
                    <Box marginVertical="sp16">
                        <Text>Hints:</Text>
                        <Hint>Hned to mažem</Hint>
                        <Hint variant="error">Please enter a valid address dumbo</Hint>
                    </Box>
                    <Box marginVertical="sp16">
                        <Text>Radio:</Text>
                        <Box flexDirection="row" justifyContent="space-between">
                            <Radio
                                key="first"
                                value="first"
                                accessibilityLabel="First"
                                onPress={handleRadioPress}
                                isChecked={radioChecked === 'first'}
                            />
                            <Radio
                                key="second"
                                value="second"
                                accessibilityLabel="Second"
                                onPress={handleRadioPress}
                                isChecked={radioChecked === 'second'}
                            />
                        </Box>
                    </Box>
                    <Box marginVertical="sp16">
                        <Text>Checkbox:</Text>
                        <Box flexDirection="row" justifyContent="space-between">
                            <CheckBox
                                isChecked={isCheckBox1Checked}
                                onChange={() => setIsCheckBox1Checked(!isCheckBox1Checked)}
                            />
                            <CheckBox
                                isChecked={isCheckBox2Checked}
                                onChange={() => setIsCheckBox2Checked(!isCheckBox2Checked)}
                            />
                            <CheckBox
                                isChecked={isCheckBox3Checked}
                                onChange={() => setIsCheckBox3Checked(!isCheckBox3Checked)}
                                isDisabled
                            />
                            <CheckBox
                                isChecked={isCheckBox4Checked}
                                onChange={() => setIsCheckBox4Checked(!isCheckBox4Checked)}
                                isDisabled
                            />
                        </Box>
                    </Box>
                    <NumPadButton value={2} onPress={() => null} />
                    <Box marginTop="sp16" marginBottom="sp16">
                        <Text>AlertBox:</Text>
                        <VStack spacing="sp16">
                            <AlertBox variant="info" title="Info" />
                            <AlertBox variant="success" title="Success" />
                            <AlertBox variant="error" title="Error" />
                            <Box>
                                <AlertBox variant="warning" title="Warning" />
                            </Box>
                            <AlertBox
                                variant="info"
                                title={
                                    <>
                                        Info AlerBox with a longer text that does not fit one row
                                        and it can also contain{' '}
                                        <Link
                                            href="https://trezor.io"
                                            label="for example link"
                                            isUnderlined
                                            textColor="textDefault"
                                        />
                                    </>
                                }
                            />
                        </VStack>
                    </Box>
                    {/* For some reason skeleton lags scrolling on iOS, we should investigate */}
                    {/* <VStack marginTop="sp16">
                        <Text variant="titleMedium">Skeleton</Text>
                        <Card>
                            <ListItemSkeleton />
                        </Card>
                    </VStack> */}
                </Box>
            </VStack>
        </Screen>
    );
};
