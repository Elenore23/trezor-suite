// @group_settings
// @retry=2

import { onNavBar } from '../../support/pageObjects/topBarObject';

// TODOS:
// - focus this test on testing what is different from T2T1: (background image, display rotation)
// - implement these differences in suite in the first place. both suite and T2B1 will happily accept
//   request to change display rotation but it has no effect. It should be at least hidden on client.
// https://github.com/trezor/trezor-suite/issues/6567

describe('T2B1 - Device settings', () => {
    const startEmuOpts = {
        version: '2-latest',
        model: 'T2B1',
        wipe: true,
    };

    beforeEach(() => {
        cy.viewport('macbook-13').resetDb();
    });

    /*
     * Test case:
     * 1. Navigate to settings/device screen and wait for it to load
     * 2. open the firmware update modal
     * 3. verify it by clicking on the close btn
     * 4. change the trezor's name via its input
     * 5. verify the name from top left wallet overview btn
     * 6. change the device's background
     * 7. change the device's rotation
     */
    it('change all possible device settings', () => {
        //
        // Test preparation & constants
        //
        const newDeviceName = 'TREVOR!';
        const editNameBtn = '@settings/device/label-submit';

        cy.task('startEmu', startEmuOpts);
        cy.task('setupEmu');
        cy.task('startBridge');

        // pass through initial run and device auth check
        cy.prefixedVisit('/');
        cy.disableFirmwareHashCheck();
        cy.getTestElement('@analytics/continue-button', { timeout: 40000 }).click();
        cy.getTestElement('@onboarding/exit-app-button').click();
        cy.passThroughAuthenticityCheck();
        cy.getTestElement('@onboarding/viewOnly/enable').click();
        cy.getTestElement('@viewOnlyTooltip/gotIt', { timeout: 15000 })
            .should('be.visible')
            .click();
        // navigate to device settings page
        onNavBar.openSettings();
        cy.getTestElement('@settings/menu/device').click();

        //
        // Test execution
        //

        // verify firmware modal
        cy.log('open firmware modal and close it again');
        cy.getTestElement('@settings/device/update-button')
            .should('be.visible')
            .click({ scrollBehavior: false });
        cy.getTestElement('@modal/close-button').click();

        // change device's name
        cy.log(`-> Filling in ${newDeviceName} as new trezor's name.`);
        cy.getTestElement('@settings/device/label-input').clear();
        cy.getTestElement('@settings/device/label-input').type(newDeviceName);
        cy.getTestElement(editNameBtn).should('be.enabled');
        cy.getTestElement(editNameBtn).click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');
        cy.log('-> Done.');

        // verify the name change
        cy.getTestElement('@menu/switch-device').contains(newDeviceName);

        // change background
        cy.log('change background');
        cy.getTestElement('@settings/device/homescreen-gallery').click();
        cy.getTestElement(`@modal/gallery/bw_64x128/circleweb`);

        // todo: for some reason, this does not work in tests
        // .click();
        // cy.getConfirmActionOnDeviceModal();
        // cy.task('pressYes');
        // cy.getConfirmActionOnDeviceModal().should('not.exist');
    });

    it('backup in settings', () => {
        cy.task('startEmu', startEmuOpts);
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');

        // pass through initial run and device auth check
        cy.prefixedVisit('/');
        cy.disableFirmwareHashCheck();
        cy.getTestElement('@analytics/continue-button', { timeout: 40000 }).click();
        cy.getTestElement('@onboarding/exit-app-button').click();
        cy.passThroughAuthenticityCheck();
        cy.getTestElement('@onboarding/viewOnly/enable').click();
        cy.getTestElement('@viewOnlyTooltip/gotIt', { timeout: 15000 })
            .should('be.visible')
            .click();
        // navigate to device settings page
        onNavBar.openSettings();
        cy.getTestElement('@settings/menu/device').click();

        cy.getTestElement('@settings/device/check-seed-button').should('be.enabled');
        cy.getTestElement('@settings/device/failed-backup-row').should('not.exist');
        cy.getTestElement('@settings/device/check-seed-button').click({ scrollBehavior: false });
        cy.getTestElement('@modal');
    });

    it('wipe device', () => {
        cy.task('startEmu', startEmuOpts);
        cy.task('setupEmu');
        cy.task('startBridge');

        // pass through initial run and device auth check
        cy.prefixedVisit('/');
        cy.disableFirmwareHashCheck();
        cy.getTestElement('@analytics/continue-button', { timeout: 40000 }).click();
        cy.getTestElement('@onboarding/exit-app-button').click();
        cy.passThroughAuthenticityCheck();
        cy.getTestElement('@onboarding/viewOnly/enable').click();
        cy.getTestElement('@viewOnlyTooltip/gotIt', { timeout: 15000 })
            .should('be.visible')
            .click();
        // navigate to device settings page
        onNavBar.openSettings();
        cy.getTestElement('@settings/menu/device').click();

        cy.getTestElement('@settings/device/open-wipe-modal-button').click();
        cy.getTestElement('@wipe/checkbox-1').click();
        cy.getTestElement('@wipe/checkbox-2').click();
        cy.getTestElement('@wipe/wipe-button').click();
        cy.task('pressYes');
    });
});
