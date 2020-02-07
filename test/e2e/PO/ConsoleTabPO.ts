import * as puppeteer from 'puppeteer';


class ConsoleTabPO {
  get tabConsole() {return '#tab-console'}
  get defaultLevel() {return '[aria-label="Log level: Default levels"]'}
  get verboseLevel() {return '[aria-label="Verbose, unchecked"]'}
  get loggedConsoleMessages() {return '.console-group-messages'}
  get firstMessageFromConsole() {return '.console-group-messages .source-code .console-message-text'}
}

export default new ConsoleTabPO();

