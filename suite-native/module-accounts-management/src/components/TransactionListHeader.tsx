import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    selectIsTestnetAccount,
    selectHasAccountTransactions,
    selectAccountByKey,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import {
    AppTabsParamList,
    RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';
import { FeatureFlag, FeatureFlagsRootState, useFeatureFlag } from '@suite-native/feature-flags';
import { isCoinWithTokens } from '@suite-native/tokens';

import { AccountDetailGraph } from './AccountDetailGraph';
import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
import { IncludeTokensToggle } from './IncludeTokensToggle';
import { CoinPriceCard } from './CoinPriceCard';
import { selectIsNetworkSendFlowEnabled } from '../selectors';

type TransactionListHeaderProps = {
    accountKey: AccountKey;
    areTokensIncluded: boolean;
    toggleIncludeTokenTransactions: () => void;
    tokenContract?: TokenAddress;
};

type TransactionListHeaderContentProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type AccountsNavigationProps = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    RootStackRoutes.ReceiveModal,
    RootStackParamList
>;

const TransactionListHeaderContent = ({
    accountKey,
    tokenContract,
}: TransactionListHeaderContentProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountHasTransactions = useSelector((state: AccountsRootState) =>
        selectHasAccountTransactions(state, accountKey),
    );
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );

    if (!account) return null;

    const isTokenAccount = !!tokenContract;

    // Graph is temporarily hidden also for ERC20 tokens.
    // Will be solved in issue: https://github.com/trezor/trezor-suite/issues/7839
    const isGraphDisplayed = accountHasTransactions && !isTestnetAccount && !isTokenAccount;

    if (isGraphDisplayed) {
        return <AccountDetailGraph accountKey={accountKey} />;
    }
    if (isTokenAccount) {
        return <AccountDetailGraph accountKey={accountKey} tokenContract={tokenContract} />;
    }

    if (isTestnetAccount) {
        return (
            <AccountDetailCryptoValue
                value={account.availableBalance}
                networkSymbol={account.symbol}
                isBalance={false}
            />
        );
    }

    return null;
};

export const TransactionListHeader = memo(
    ({
        accountKey,
        areTokensIncluded,
        toggleIncludeTokenTransactions,
        tokenContract,
    }: TransactionListHeaderProps) => {
        const navigation = useNavigation<AccountsNavigationProps>();
        const [isDeviceConnectEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );

        const accountHasTransactions = useSelector((state: AccountsRootState) =>
            selectHasAccountTransactions(state, accountKey),
        );
        const isTestnetAccount = useSelector((state: AccountsRootState) =>
            selectIsTestnetAccount(state, accountKey),
        );
        const isNetworkSendFlowEnabled = useSelector((state: FeatureFlagsRootState) =>
            selectIsNetworkSendFlowEnabled(state, account?.symbol),
        );
        const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

        if (!account) return null;

        const handleReceive = () => {
            navigation.navigate(RootStackRoutes.ReceiveModal, {
                accountKey,
                tokenContract,
                closeActionType: 'back',
            });
        };

        const handleSend = () => {
            navigation.navigate(RootStackRoutes.SendStack, {
                screen: SendStackRoutes.SendOutputs,
                params: {
                    accountKey,
                    tokenContract,
                },
            });
        };

        const isTokenDetail = !!tokenContract;
        const canHaveTokens = !isTokenDetail && isCoinWithTokens(account.symbol);
        const isPriceCardDisplayed = !isTestnetAccount && !isTokenDetail;

        const isSendButtonDisplayed =
            isDeviceConnectEnabled && isNetworkSendFlowEnabled && !isPortfolioTrackerDevice;

        return (
            <Box marginBottom="sp8">
                <VStack spacing="sp24">
                    <TransactionListHeaderContent
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                    {accountHasTransactions && (
                        <HStack
                            marginVertical="sp16"
                            paddingHorizontal="sp16"
                            flex={1}
                            spacing="sp12"
                        >
                            <Box flex={1}>
                                <Button
                                    viewLeft="arrowLineDown"
                                    size="large"
                                    onPress={handleReceive}
                                    testID="@account-detail/receive-button"
                                >
                                    <Translation id="transactions.receive" />
                                </Button>
                            </Box>
                            {isSendButtonDisplayed && (
                                <Box flex={1}>
                                    <Button
                                        viewLeft="arrowLineUp"
                                        size="large"
                                        onPress={handleSend}
                                        testID="@account-detail/send-button"
                                    >
                                        <Translation id="transactions.send" />
                                    </Button>
                                </Box>
                            )}
                        </HStack>
                    )}
                    {isPriceCardDisplayed && (
                        <Box marginBottom={accountHasTransactions ? undefined : 'sp16'}>
                            <CoinPriceCard accountKey={accountKey} />
                        </Box>
                    )}

                    {accountHasTransactions && (
                        <>
                            <Divider />
                            <Box marginVertical="sp8" marginHorizontal="sp24">
                                <Text variant="titleSmall">
                                    <Translation id="transactions.title" />
                                </Text>
                            </Box>
                        </>
                    )}
                </VStack>

                {canHaveTokens && accountHasTransactions && (
                    <IncludeTokensToggle
                        networkSymbol={account.symbol}
                        isToggled={areTokensIncluded}
                        onToggle={toggleIncludeTokenTransactions}
                    />
                )}
            </Box>
        );
    },
);
