import styled, { useTheme } from 'styled-components';

import { Column, Icon, Row, variables } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacingsPx } from '@trezor/theme';

import { AccountLabeling, Translation } from 'src/components/suite';
import { FORM_SEND_CRYPTO_CURRENCY_SELECT } from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CoinmarketVerifyOptionsItemProps } from 'src/types/coinmarket/coinmarketVerify';
import { isCoinmarketExchangeContext } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketBalance } from 'src/views/wallet/coinmarket/common/CoinmarketBalance';

const LogoWrapper = styled.div`
    padding: 0 0 0 ${spacingsPx.xxs};
`;

const AccountWrapper = styled.div`
    padding: 0 0 0 ${spacingsPx.md};
`;

const AccountName = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const CoinmarketVerifyOptionsItem = ({
    option,
    receiveNetwork,
}: CoinmarketVerifyOptionsItemProps) => {
    const context = useCoinmarketFormContext();
    const { cryptoIdToPlatformName, cryptoIdToCoinName } = useCoinmarketInfo();
    const theme = useTheme();
    const iconSize = 24;

    if (option.type === 'SUITE') {
        if (!option.account) return null;

        const { symbol, formattedBalance } = option.account;

        return (
            <Row alignItems="center">
                <LogoWrapper>
                    <Row alignItems="center">
                        <CoinLogo size={iconSize} symbol={symbol} />
                    </Row>
                </LogoWrapper>
                <AccountWrapper>
                    <Column alignItems="flex-start">
                        <AccountName>
                            <AccountLabeling
                                account={option.account}
                                accountTypeBadgeSize="small"
                                showAccountTypeBadge
                            />
                        </AccountName>
                        <CoinmarketBalance
                            balance={formattedBalance}
                            cryptoSymbolLabel={symbol.toLocaleUpperCase()}
                            symbol={symbol}
                            sendCryptoSelect={
                                isCoinmarketExchangeContext(context)
                                    ? context.getValues(FORM_SEND_CRYPTO_CURRENCY_SELECT)
                                    : undefined
                            }
                        />
                    </Column>
                </AccountWrapper>
            </Row>
        );
    }

    const { networkId, contractAddress } = parseCryptoId(receiveNetwork);
    const networkName = contractAddress
        ? cryptoIdToPlatformName(networkId)
        : cryptoIdToCoinName(networkId);

    if (option.type === 'ADD_SUITE') {
        return (
            <Row>
                <LogoWrapper>
                    <Row alignItems="center">
                        <Icon name="plus" size={iconSize} color={theme.iconSubdued} />
                    </Row>
                </LogoWrapper>
                <AccountWrapper>
                    <Column alignItems="flex-start">
                        <Translation
                            id="TR_EXCHANGE_CREATE_SUITE_ACCOUNT"
                            values={{
                                symbol: networkName,
                            }}
                        />
                    </Column>
                </AccountWrapper>
            </Row>
        );
    }

    return (
        <Row>
            <LogoWrapper>
                <Row alignItems="center">
                    <Icon name="nonSuite" size={iconSize} color={theme.iconSubdued} />
                </Row>
            </LogoWrapper>
            <AccountWrapper>
                <Column alignItems="flex-start">
                    <Translation
                        id="TR_EXCHANGE_USE_NON_SUITE_ACCOUNT"
                        values={{
                            symbol: networkName,
                        }}
                    />
                </Column>
            </AccountWrapper>
        </Row>
    );
};
