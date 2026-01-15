import { GreenCometPage, GreenCometSections } from "../page_objects/GreenComet";
import {
  EnhancedPageObject,
  NightwatchBrowser,
  NightwatchTests,
  WindowSize
} from "nightwatch";

import { assert } from "chai";

import type { WebDriver } from "selenium-webdriver";
import { percyScreenshot } from "@percy/selenium-webdriver";

import {
  expectAllNotPresent,
  expectAllVisible,
} from "../utils";

type GreenCometTests = NightwatchTests & { app: GreenCometPage; sections: GreenCometSections };

const tests: GreenCometTests = {

  app: null as unknown as (EnhancedPageObject & GreenCometPage),
  sections: null as unknown as GreenCometSections,
  driver: null as unknown as WebDriver,

  before: function(browser: NightwatchBrowser): void {
    browser.globals.waitForConditionTimeout = 30_000;
    this.app = browser.page.GreenComet();
    this.sections = this.app.section as GreenCometSections;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error The `driver` member is defined
    this.driver = browser.driver;
  },

  'Navigation and loading': function() {
    this.app.navigate().waitForReady();
  },

  'Initial configuration': async function() {

    await percyScreenshot(this.driver, "Initial configuration");

    await app.expect.title().to.equal(this.app.props.title);
    await expectAllVisible(this.app, [
      "@splashScreen",
      "@splashClose"
    ]);
    await expectAllNotPresent(this.app, [
      "@videoDialog",
      "@locationDialog",
      "@infoSheet"
    ]);

    await this.app.click("@splashClose");
    await expectAllNotPresent(this.app, [
      "@splashScreen",
      "@splashClose"
    ]);

    await expectAllVisible(this.sections.topContent, [
      "@videoIcon",
      "@textIcon",
      "@mapIcon"
    ]);

    const bottomContent = this.sections.bottomContent;
    await expectAllVisible(bottomContent, [
      "@playPauseIcon",
      "@slider"
    ]);

    await bottomContent.expect.elements("@creditIcon").count.to.equal(bottomContent.props.creditIconCount);
    
    const folderView = this.sections.folderView;
    await folderView.expect.elements("@folderItem").count.to.equal(folderView.props.folderImageCount);
    await folderView.expect.element("@expandHeader").text.to.match(folderView.props.expandedHeaderText);
    await folderView.expect.element("@expandChevron").to.have.attribute("data-icon", "chevron-up");

    const controls = this.sections.controls;
    await controls.expect.element("@openCloseButton").to.have.attribute("data-icon", "chevron-down");
    await controls.expect.element("@gridInput").to.be.selected;
    await controls.expect.element("@constellationsInput").to.not.be.selected;
    await controls.expect.element("@horizonInput").to.not.be.selected; 

    await controls.expect.element("@selectedLocationTimeLabel").text.to.match(controls.props.selectedLocationTimeText);
    await controls.expect.element("@centerOnNowButtonContent").text.to.match(controls.props.centerOnNowText);
    await controls.expect.element("@playCometImagesContent").text.to.match(controls.props.playCometImagesText);

    await expectAllVisible(controls, [
      "@topRow", "@openCloseButton",
      "@gridCheckbox", "@constellationsCheckbox", "@horizonCheckbox",
      "@selectedLocationTimeLabel", "@selectedLocationTimeInput",
      "@timeIcon", "@centerOnNowButton", "@playCometImagesButton"
    ]);

    await percyScreenshot(this.driver, "Controls open");

    await controls.click("@openCloseButton");

    await percyScreenshot(this.driver, "Controls closed");
  },

  'Open video': async function() {
    await this.sections.topContent.click("@videoIcon");
    await this.app.expect.element("@videoDialog").to.be.visible;
    expectAllVisible(this.sections.videoDialog, [
      "@video", "@closeIcon"
    ]);

    await percyScreenshot(this.driver, "Video open");

    await this.sections.videoDialog.click("@closeIcon");
    await this.app.expect.element("@videoDialog").to.not.be.present;

    await percyScreenshot(this.driver, "Video closed");
  },

  'Info text': async function(browser: NightwatchBrowser) {
    await this.sections.topContent.click("@textIcon");
    await this.app.expect.element("@infoSheet").to.be.visible;

    const infoSheet = this.sections.infoSheet;
    await expectAllVisible(infoSheet, [
      "@closeIcon",
      "@infoTabHeader",
      "@wwtTabHeader",
      "@infoText"
    ]);
    await infoSheet.expect.element("@wwtText").to.not.be.present;
    await infoSheet.expect.elements("@tabHeader").count.to.equal(infoSheet.props.tabCount);

    await percyScreenshot(this.driver, "Info sheet open");
    
    // getWindowSize seems to return the height of the browser
    // (that is, including the tab and address bars)
    // but we want just the height of the viewport
    await this.app.getElementSize("html", (windowSize) => {
      this.app.getElementSize("@mainContent", (mainContentSize) => {
        const wsize = windowSize.value as WindowSize;
        const csize = mainContentSize.value as WindowSize;
        assert(Math.round(csize.height - 0.66 * wsize.height) < 2);
        browser.assert.equal(wsize.width, csize.width);
      });
    });

    await infoSheet.click("@wwtTabHeader");
    await infoSheet.expect.element("@infoText").to.be.present;
    await infoSheet.expect.element("@infoText").to.not.be.visible;

    await percyScreenshot(this.driver, "Info sheet - WWT Tab");

    await infoSheet.click("@infoTabHeader");
    await infoSheet.expect.element("@wwtText").to.be.present;
    await infoSheet.expect.element("@wwtText").to.not.be.visible;

    await percyScreenshot(this.driver, "Info sheet - Info Tab");

    await infoSheet.click("@closeIcon");
    await this.app.expect.element("@infoSheet").to.not.be.present;

    await percyScreenshot(this.driver, "Info sheet closed");
  },

  'Location selector': async function() {
    await this.sections.topContent.click("@mapIcon");

    await percyScreenshot(this.driver, "Location selector open");
  
    const locationDialog = this.sections.locationDialog;
    await expectAllVisible(locationDialog, [
      "@useMyLocationButton",
      "@mapContainer"
    ]);
    await locationDialog.expect.element("@useMyLocationButtonContent").text.to.match(locationDialog.props.useMyLocationText);
    await locationDialog.expect.element("@actionText").text.to.match(locationDialog.props.actionText);

    await browser.sendKeys("html", browser.Keys.ESCAPE); 
    await this.app.expect.element("@locationDialog").to.not.be.present;

    await percyScreenshot(this.driver, "Location selector closed");
  },

  'Folder View': async function() {
    const folderView = this.sections.folderView;
    await folderView.click("@expandRow");
    await folderView.expect.elements("@folderItem").count.to.equal(0);
    await folderView.expect.element("@expandHeader").text.to.match(folderView.props.contractedHeaderText);
    await folderView.expect.element("@expandChevron").to.have.attribute("data-icon", "chevron-down");

    await percyScreenshot(this.driver, "Folder view open");

    await folderView.click("@expandRow");
    await folderView.expect.elements("@folderItem").count.to.equal(folderView.props.folderImageCount);
    await folderView.expect.element("@expandHeader").text.to.match(folderView.props.expandedHeaderText);
    await folderView.expect.element("@expandChevron").to.have.attribute("data-icon", "chevron-up");

    await percyScreenshot(this.driver, "Folder view closed");
  },

  'Control Panel': async function() {
    const controls = this.sections.controls;

    const shouldControlsBeOpen = !browser.isMobile();
    if (!shouldControlsBeOpen) {
      await controls.expect.element("@openCloseButton").to.have.attribute("data-icon", "gear");
      await expectAllNotPresent(controls, [
        "@gridInput", "@constellationsInput", "@horizonInput",
        "@selectedLocationTimeLabel", "@selectedLocationTimeInput",
        "@timeIcon", "@centerOnNowButton", "@playCometImagesButton"
      ]);

      await controls.click("@openCloseButton");
    }

    await controls.expect.element("@openCloseButton").to.have.attribute("data-icon", "chevron-down");
    await expectAllVisible(controls, [
      "@topRow", "@openCloseButton",
      "@gridCheckbox", "@constellationsCheckbox", "@horizonCheckbox",
      "@selectedLocationTimeLabel", "@selectedLocationTimeInput",
      "@timeIcon", "@centerOnNowButton", "@playCometImagesButton"
    ]);

    await percyScreenshot(this.driver, "Control panel open");

    await controls.click("@openCloseButton");
    await controls.expect.element("@openCloseButton").to.have.attribute("data-icon", "chevron-down");
    await expectAllNotPresent(controls, [
      "@topRow", "@openCloseButton",
      "@gridCheckbox", "@constellationsCheckbox", "@horizonCheckbox",
      "@selectedLocationTimeLabel", "@selectedLocationTimeInput",
      "@timeIcon", "@centerOnNowButton", "@playCometImagesButton"
    ]);

    await percyScreenshot(this.driver, "Control panel closed");
  },

  after: async function(browser: NightwatchBrowser) {
    await browser.end();
  }
};

export default tests;
