import IPersonalInfomation from './personal-infomation.model';
import {IWorkExperience} from './work-experience.model';
import IProject from './project.model';
import ISkill from './skill.model';
import IEducation from './education.model';
import IAward from './award.model';
import ILanguage from './language.model';

export default interface IResumeData {
    personalInfomation: IPersonalInfomation,
    sumary: string,
    workExperiences: Array<IWorkExperience>,
    projects: Array<IProject>,
    skill: ISkill,
    educations: Array<IEducation>,
    awards: Array<IAward>,
    languages: Array<ILanguage>,
    interests: Array<string>,
    github: string
}