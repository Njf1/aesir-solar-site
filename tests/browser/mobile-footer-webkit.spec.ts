import {test} from '@playwright/test';
import {footerTests} from './helpers/mobile-footer';
test.use({browserName:'webkit',launchOptions:{headless:true},isMobile:true,hasTouch:true,deviceScaleFactor:2});
footerTests('webkit');
