// Adapters
import { onlineAdapters } from "./adapters/AdapterList";
import { OnlineAdapter } from "./cornerstone/OnlineAdapter";

// Core Components
import { AdapterManager } from "./cornerstone/AdapterManager";
import { Cache } from "./cornerstone/Cache";
import { LoggingLevel } from "./cornerstone/CommonEnums";
import { CornerStoneBible } from "./cornerstone/CornerStone";
import { Logger } from "./cornerstone/Logger";
import { StandardOuputConverter } from "./cornerstone/outputFormats/StandardOutputConverter";
import { SmartGetter } from "./cornerstone/SmartGetter";

// Utilities
import { BrowserWebGetter } from "./utilities/BrowserWebGetter";
import { NodeWebGetter } from "./utilities/NodeWebGetter";
import { isBrowser, isNode } from "./utilities/Platform";
import { Validator } from "./utilities/Validator";

// Interfaces
import { IAdapter } from "./interfaces/IAdapter";
import { ICornerStoneSettings } from "./interfaces/ICornerStone";

/**
 * Creates and returns the CornerStone object using
 * the provided settings.
 */
export function New({
   cacheSize = 13,
   logging= false,
   loggingLevel = "WARN",
   outputFormat = "standard",
   newlineCharacter = "\n",
   verseFormat = "raw",
}: ICornerStoneSettings = {})
{
   const logger = new Logger({loggingEnabled: logging, loggingLevel: getLoggingLevel(loggingLevel)});
   const cache = new Cache(logger);

   /**
    * Set the web getter based on the platform.
    * This could possibly be removed due to webpack.
    */
   let webGetter;
   if (isBrowser()) {
      logger.info("Detected Browser environment.");
      webGetter = new BrowserWebGetter(logger);
   } else if (isNode()) {
      logger.info("Detected Node environment.");
      webGetter = new NodeWebGetter(logger);
   } else {
      throw logger.logAndGiveError("Platform/environment not recognized or supported. " +
                                   "Expected to run in Node or Browser.");
   }

   /**
    * Create a Validator
    * If noValidation is set, use an empty validator. Useful for TypeScript
    * which already does checking at compile time.
    */
   const validator = new Validator();

   // Create smart caching.
   const smartGetter = new SmartGetter(logger, cache, webGetter);

   // Compile the adapters.
   const adapters: IAdapter[] = [];
   for (const onlineAdapterOptions of onlineAdapters) {
      adapters.push(new OnlineAdapter(logger, smartGetter, onlineAdapterOptions));
   }

   // Create output converters.
   const converter = new StandardOuputConverter();

   // Start putting everything together.
   const adapterManager = new AdapterManager(logger, adapters);
   return new CornerStoneBible(
      logger,
      adapterManager,
      validator,
      converter
   );
}

function getLoggingLevel(level: string): LoggingLevel
{
   let loggingLevel: LoggingLevel;
   level = level.toUpperCase();
   switch (level) {
      case "ERROR": {
         loggingLevel = LoggingLevel.ERROR;
         break;
      }
      case "WARN": {
         loggingLevel = LoggingLevel.WARN;
         break;
      }
      case "DEBUG": {
         loggingLevel = LoggingLevel.DEBUG;
         break;
      }
      case "INFO": {
         loggingLevel = LoggingLevel.INFO;
         break;
      }
      default: {
         loggingLevel = LoggingLevel.WARN;
         break;
      }
   }
   return loggingLevel;
}
