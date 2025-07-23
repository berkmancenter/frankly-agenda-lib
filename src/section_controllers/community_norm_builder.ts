import { AgendaItem, AgendaSection } from "../models/agenda_models.js";
import communityNormData from "../section_data/initial_event/comunity_norms.json"
import communityNormFollowOnData from "../section_data/follow_on_event/comunity_norms.json"
import { ISectionBuilder } from "./section_builder.js";

export class CommunityNormBuilder implements ISectionBuilder {

    topic: string;
    isInitial: boolean;

    constructor(topic: string, isInitial: boolean) {
        this.topic = topic;
        this.isInitial = isInitial;
    }

    public createSection(): AgendaSection {
        // section info
        const normSection = new AgendaSection(communityNormData.section, communityNormData.sectionDescription);
        const recommendedNorms: number[] = this.determineItems();

        let normItems: AgendaItem[];

        if (this.isInitial) {
            normItems = this.createItems(recommendedNorms, communityNormData);
        } else {
            normItems = this.createItems(recommendedNorms, communityNormFollowOnData);
        }

        for (let introItem of normItems) {
            normSection.addItem(introItem);
        }

        return normSection;
    }

    createItems(recommendedNorms: number[], normData): AgendaItem[] {
        var agendaItems = [];

        for (var i = 0; i < normData.items.length; i++) {
            if (i in recommendedNorms) {
                const title = normData.items[i].title; // first string is the title
                const content = normData.items[i].content; // remaining strings are the content bullets
                agendaItems.push(new AgendaItem(title, content));
            }
        }
        return agendaItems;
    }

    determineItems(): number[] {
        /// TODO: use LLM to determine which items to recommend
        return [0, 1, 3, 5];
    }
}