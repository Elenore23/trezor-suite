import { useState } from 'react';

import styled, { useTheme } from 'styled-components';

import { variables, Icon } from '@trezor/components';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';
import {
    formatNetworkAmount,
    getTargetAmount,
    getTxHeaderSymbol,
    getTxOperation,
    isSupportedEthStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { spacingsPx } from '@trezor/theme';

import {
    FormattedCryptoAmount,
    TooltipSymbol,
    Translation,
    TrezorLink,
} from 'src/components/suite';
import { WalletAccountTransaction } from 'src/types/wallet';

import { TransactionHeader } from './TransactionHeader';
import { BlurWrapper } from './TransactionItemBlurWrapper';
import { InstantStakeBadge } from './InstantStakeBadge';

const Wrapper = styled.span`
    display: flex;
    flex: 1 1 auto;
    text-overflow: ellipsis;
    overflow: hidden;
    align-items: center;
    cursor: pointer;
`;

const HeadingWrapper = styled.div`
    display: flex;
    align-items: center;
    text-overflow: ellipsis;
    overflow: hidden;
`;

const ChevronIconWrapper = styled.div<{ $show: boolean; $animate: boolean }>`
    display: flex;
    margin-left: ${({ $animate }) => ($animate ? '5px' : '3px')};
    opacity: ${({ $show }) => ($show ? 1 : 0)};
    transition:
        visibility 0s,
        opacity 0.15s linear,
        margin-left 0.15s ease-in-out;

    /* select non-direct SVG children (the icon) and set animation property */
    > * svg {
        transition: all 0.2ms ease-in-out;
    }
`;

const StyledCryptoAmount = styled(FormattedCryptoAmount)<{ $isPhishingTransaction: boolean }>`
    color: ${({ theme, $isPhishingTransaction }) =>
        $isPhishingTransaction ? theme.legacy.TYPE_LIGHT_GREY : theme.legacy.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    white-space: nowrap;
    flex: 0;
`;

const HelpLink = styled(TrezorLink)`
    color: ${({ theme }) => theme.legacy.TYPE_ORANGE};

    path {
        fill: ${({ theme }) => theme.legacy.TYPE_ORANGE};
    }
`;

const HeaderWrapper = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
`;

interface TransactionHeadingProps {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    useSingleRowLayout: boolean;
    txItemIsHovered: boolean;
    nestedItemIsHovered: boolean;
    onClick: () => void;
    isPhishingTransaction: boolean;
    dataTestBase: string;
}

export const TransactionHeading = ({
    transaction,
    isPending,
    useSingleRowLayout,
    txItemIsHovered,
    nestedItemIsHovered,
    onClick,
    isPhishingTransaction,
    dataTestBase,
}: TransactionHeadingProps) => {
    const [headingIsHovered, setHeadingIsHovered] = useState(false);

    const theme = useTheme();

    const symbol = getTxHeaderSymbol(transaction);
    const target = transaction.targets[0];
    const targetSymbol = transaction.type === 'self' ? transaction.symbol : symbol;
    let amount = null;

    if (useSingleRowLayout) {
        // In case of sent-to-self transaction we rely on getTargetAmount returning transaction.amount which will be equal to a fee
        const targetAmount = getTargetAmount(target, transaction);
        const operation = getTxOperation(transaction.type);

        amount = targetAmount && (
            <StyledCryptoAmount
                value={targetAmount}
                symbol={targetSymbol}
                signValue={operation}
                $isPhishingTransaction={isPhishingTransaction}
            />
        );
    }

    if (transaction.type === 'joint') {
        const transactionAmount = new BigNumber(transaction.amount);
        const abs = transactionAmount.abs().toString();

        amount = (
            <StyledCryptoAmount
                value={formatNetworkAmount(abs, transaction.symbol)}
                symbol={transaction.symbol}
                signValue={transactionAmount}
                $isPhishingTransaction={isPhishingTransaction}
            />
        );
    }

    return (
        <>
            <Wrapper
                onMouseEnter={() => setHeadingIsHovered(true)}
                onMouseLeave={() => setHeadingIsHovered(false)}
                onClick={onClick}
            >
                <HeadingWrapper data-testid={`${dataTestBase}/heading`}>
                    {isPhishingTransaction && (
                        <TooltipSymbol
                            content={
                                <Translation
                                    id="TR_ZERO_PHISHING_TOOLTIP"
                                    values={{
                                        a: chunks => (
                                            <HelpLink
                                                href={HELP_CENTER_ZERO_VALUE_ATTACKS}
                                                icon="arrowUpRight"
                                                typographyStyle="hint"
                                            >
                                                {chunks}
                                            </HelpLink>
                                        ),
                                    }}
                                />
                            }
                            icon="warningTriangle"
                        />
                    )}
                    <BlurWrapper $isBlurred={isPhishingTransaction}>
                        <HeaderWrapper>
                            <TransactionHeader transaction={transaction} isPending={isPending} />
                            {isSupportedEthStakingNetworkSymbol(transaction.symbol) && (
                                <InstantStakeBadge transaction={transaction} symbol={symbol} />
                            )}
                        </HeaderWrapper>
                    </BlurWrapper>
                </HeadingWrapper>

                <ChevronIconWrapper
                    $show={txItemIsHovered}
                    $animate={nestedItemIsHovered || headingIsHovered}
                >
                    <Icon
                        size={nestedItemIsHovered || headingIsHovered ? 18 : 16}
                        color={theme.legacy.TYPE_DARK_GREY}
                        name="caretRight"
                    />
                </ChevronIconWrapper>
            </Wrapper>

            {transaction.type !== 'failed' && amount}
        </>
    );
};
