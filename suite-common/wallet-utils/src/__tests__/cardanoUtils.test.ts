import { CARDANO, PROTO } from '@trezor/connect';

import {
    getAddressType,
    getDelegationCertificates,
    getNetworkId,
    getProtocolMagic,
    getShortFingerprint,
    getStakePoolForDelegation,
    parseAsset,
    getStakingPath,
    transformUserOutputs,
    isCardanoTx,
    isCardanoExternalOutput,
    isPoolOverSaturated,
    formatMaxOutputAmount,
    getUnusedChangeAddress,
    getAddressParameters,
    getDerivationType,
} from '../cardanoUtils';
import * as fixtures from '../__fixtures__/cardanoUtils';

describe('cardano utils', () => {
    let dateSpy: any;
    beforeAll(() => {
        dateSpy = jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1653394389512);
    });

    afterAll(() => {
        dateSpy.mockRestore();
    });

    it('basic test', () => {
        expect(getProtocolMagic('ada')).toEqual(CARDANO.PROTOCOL_MAGICS.mainnet);
        expect(getProtocolMagic('tada')).toEqual(1097911063);

        expect(getDerivationType('normal')).toEqual(1);
        expect(getDerivationType('legacy')).toEqual(2);
        expect(getDerivationType('ledger')).toEqual(0);
        // TS does not allow this, but in runtime, the default case handles it
        expect(getDerivationType(undefined as any)).toEqual(1);

        expect(getNetworkId('ada')).toEqual(CARDANO.NETWORK_IDS.mainnet);
        expect(getNetworkId('tada')).toEqual(CARDANO.NETWORK_IDS.testnet);

        expect(getAddressType()).toEqual(PROTO.CardanoAddressType.BASE);
        expect(getAddressType()).toEqual(PROTO.CardanoAddressType.BASE);

        // @ts-expect-error
        expect(getStakingPath({ index: 1, symbol: 'ada' })).toEqual(`m/1852'/1815'/1'/2/0`);

        // @ts-expect-error
        expect(getStakingPath({ index: 12, symbol: 'ada' })).toEqual(`m/1852'/1815'/12'/2/0`);
        expect(getShortFingerprint('asset1dffrfk79uxwq2a8yaslcfedycgga55tuv5dezd')).toEqual(
            'asset1dffr…55tuv5dezd',
        );

        // @ts-expect-error params are partial
        expect(isCardanoTx({ networkType: 'cardano' }, {})).toBe(true);
        // @ts-expect-error params are partial
        expect(isCardanoTx({ networkType: 'bitcoin' }, {})).toBe(false);
        // @ts-expect-error params are partial
        expect(isCardanoExternalOutput({ address: 'addr1' }, {})).toBe(true);
        // @ts-expect-error params are partial
        expect(isCardanoExternalOutput({ addressParameters: {} }, {})).toBe(false);
    });

    fixtures.getChangeAddressParameters.forEach(f => {
        it(`getChangeAddressParameters: ${f.description}`, () => {
            const address = getUnusedChangeAddress(f.account);
            const res = address && {
                address: address.address,
                // @ts-expect-error params are partial
                addressParameters: getAddressParameters(f.account, address.path),
            };
            expect(res).toMatchObject(f.result);
        });
    });

    fixtures.transformUserOutputs.forEach(f => {
        it(`transformUserOutputs: ${f.description}`, () => {
            expect(
                transformUserOutputs(
                    // @ts-expect-error params are partial
                    f.outputs,
                    f.accountTokens,
                    f.symbol,
                    f.maxOutputIndex,
                ),
            ).toMatchObject(f.result);
        });
    });

    fixtures.formatMaxOutputAmount.forEach(f => {
        it(`transformUserOutputs: ${f.description}`, () => {
            expect(
                // @ts-expect-error params are partial
                formatMaxOutputAmount(f.maxAmount, f.maxOutput, f.account),
            ).toBe(f.result);
        });
    });

    fixtures.parseAsset.forEach(f => {
        it(`parseAsset: ${f.description}`, () => {
            expect(parseAsset(f.hex)).toMatchObject(f.result);
        });
    });

    fixtures.isPoolOverSaturated.forEach(f => {
        it(`isPoolOverSaturated: ${f.description}`, () => {
            // @ts-expect-error params are partial
            expect(isPoolOverSaturated(f.pool, f.additionalStake)).toBe(f.result);
        });
    });

    fixtures.getStakePoolForDelegation.forEach(f => {
        it(`getStakePoolForDelegation: ${f.description}`, () => {
            expect(getStakePoolForDelegation(f.trezorPools, f.accountBalance)).toMatchObject(
                f.result,
            );
        });
    });
    fixtures.getDelegationCertificates.forEach(f => {
        it(`getDelegationCertificates: ${f.description}`, () => {
            expect(
                getDelegationCertificates(f.stakingPath, f.poolHex, f.shouldRegister),
            ).toMatchObject(f.result);
        });
    });
});
