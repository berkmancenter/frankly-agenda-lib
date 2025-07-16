import { AgendaItem, AgendaSection } from "../models/agenda_models.js";
import communityNormData from "../section_data/comunity_norms.json"
import { ISectionBuilder } from "./section_builder.js";

export class CommunityNormBuilder implements ISectionBuilder {

    topic: string;

    constructor(topic: string) {
        this.topic = topic;
    }

    public createSection(): AgendaSection {
        // section info
        const normSection = new AgendaSection(communityNormData.section, communityNormData.sectionDescription);

        const recommendedNorms: number[] = this.determineItems();

        const normItems: AgendaItem[] = this.createItems(recommendedNorms);

        for (let introItem of normItems) {
            normSection.addItem(introItem);
        }
        return normSection;
    }

    createItems(recommendedNorms: number[]): AgendaItem[] {
        var agendaItems = [];

        for (var i = 0; i < communityNormData.items.length; i++) {
            if (i in recommendedNorms) {
                const title = communityNormData.items[i].title; // first string is the title
                const content = communityNormData.items[i].content; // remaining strings are the content bullets
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