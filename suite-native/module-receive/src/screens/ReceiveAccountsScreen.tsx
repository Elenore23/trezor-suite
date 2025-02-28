import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsList,
    OnSelectAccount,
    SearchableAccountsListScreenHeader,
} from '@suite-native/accounts';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import {
    ReceiveStackParamList,
    ReceiveStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

export const ReceiveAccountsScreen = () => {
    const navigation = useNavigation<NavigationProps>();

    const navigateToReceiveScreen: OnSelectAccount = ({ account, tokenAddress }) =>
        navigation.navigate(RootStackRoutes.ReceiveModal, {
            accountKey: account.key,
            tokenContract: tokenAddress,
            closeActionType: 'back',
        });

    const [accountsFilterValue, setAccountsFilterValue] = useState<string>('');

    const handleFilterChange = (value: string) => {
        setAccountsFilterValue(value);
    };

    return (
        <Screen
            customHorizontalPadding="sp16"
            screenHeader={<DeviceManagerScreenHeader />}
            subheader={
                <SearchableAccountsListScreenHeader
                    title="Receive to"
                    onSearchInputChange={handleFilterChange}
                    flowType="receive"
                />
            }
        >
            <AccountsList
                onSelectAccount={navigateToReceiveScreen}
                filterValue={accountsFilterValue}
                hideTokensIntoModal
            />
        </Screen>
    );
};
