import { AgendaItem, AgendaSection, createDurationByTimeUnit, CustomDuration } from "../models/agenda_models.js";
import { ISectionBuilder } from "./section_builder.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CustomError, ErrorCategory, ErrorType } from "../utils/result_handling.js";
import { Goals } from "../utils/global_enums.js";
export class CommunityNormBuilder implements ISectionBuilder {

    topic: string;
    isFollowOn: boolean;
    totalLength: number;
    finalGoal: Goals;
    communityNormData;
    communityNormFollowOnData;

    warnings: CustomError[] = [];


    constructor(topic: string, isFollowOn: boolean, finalGoal: string) {
        this.topic = topic;
        this.isFollowOn = isFollowOn; // first event or single event
        this.totalLength = 0;
        this.finalGoal = Goals[finalGoal];

        // bring in JSON agenda items
        const __dirname = dirname(fileURLToPath(import.meta.url));
        try {
            this.communityNormData = JSON.parse(readFileSync(join(__dirname, '../section_data/initial_event/comunity_norms.json'), 'utf-8'));
            this.communityNormFollowOnData = JSON.parse(readFileSync(join(__dirname, '../section_data/follow_on_event/comunity_norms.json'), 'utf-8'));
        } catch (e) {
            throw new CustomError(ErrorCategory.ParsingError, "Unable to parse community norm data.", ErrorType.error, e);
        }

    }

    public getIntroLengthInMinutes(): number {
        return this.totalLength;
    }

    public async createSection():  Promise<AgendaSection> {
        // section info
        const normSection = new AgendaSection(this.communityNormData.section, this.communityNormData.sectionDescription);

        let normItems: AgendaItem[];
        let tempDur: number = 0;

        if (this.isFollowOn) {
            tempDur = 2;
            const recommendedNorms: number[] = this.determineItems(this.communityNormFollowOnData);
            normItems = this.createItems(recommendedNorms, this.communityNormFollowOnData);
            this.totalLength = this.totalLength + tempDur;
        } else {
            tempDur = 5;
            const recommendedNorms: number[] = this.determineItems(this.communityNormData);
            normItems = this.createItems(recommendedNorms, this.communityNormData);
            this.totalLength = this.totalLength + tempDur;
        }
        normSection.duration = createDurationByTimeUnit({ minutes: tempDur });

        for (let introItem of normItems) {
            normSection.addItem(introItem);
        }

        return normSection;
    }

    createItems(recommendedNorms: number[], normData): AgendaItem[] {
        var agendaItems = [];

        for (var i = 0; i < normData.items.length; i++) {
            if (recommendedNorms.includes(i)) {
                const title = normData.items[i].title; // first string is the title
                const content = normData.items[i].content; // remaining strings are the content bullets
                agendaItems.push(new AgendaItem(title, content));
            }
        }
        return agendaItems;
    }

    determineItems(normData): number[] {
        let normsArray = [];
        if (this.finalGoal == Goals.dialogue || this.finalGoal == Goals.exploration) {
            normsArray.push(normData.items.findIndex(item => item.id === "curious"));
        }
        normsArray.push(normData.items.findIndex(item => item.id === "respectful"));
        if (this.finalGoal == Goals.dialogue) {
            normsArray.push(normData.items.findIndex(item => item.id === "speakExperience"));
        }
        if (this.finalGoal == Goals.deliberation) {
            normsArray.push(normData.items.findIndex(item => item.id === "commonGround"));
            normsArray.push(normData.items.findIndex(item => item.id === "purposeful"));
        }
        normsArray.push(normData.items.findIndex(item => item.id === "conversationResponsibility"));
        return normsArray;
    }
}