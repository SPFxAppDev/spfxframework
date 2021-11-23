export abstract class SPfxAppDevConfiguration {

    public static settingsListUrl: string = '';

    public static solutionId: string = "";

    public static bootLoaderName: string = `SPFxAppDevBootloader_${SPfxAppDevConfiguration.solutionId}`;
}