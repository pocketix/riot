import { SdInstance, SdParameter } from "@generated/graphql";

export interface BulletCardInfo {
    _cardID: string;
    title?: string;
    icon?: string;
    color?: string;
    data: [
        {
            id: string;
            ranges: [number];
            instance: SdInstance;
            parameter: SdParameter;
            measure?: number;
            aggregatedTime?: string;
            marker: number;
        }
    ]
};