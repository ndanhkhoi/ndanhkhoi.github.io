import React from 'react';
import {IWorkExperience} from '../model/work-experience.model';

const WorkExperiences: React.FC<{workExperiences: Array<IWorkExperience>}> = ({workExperiences}) => {

    return (
        <section className="work-section py-3">
            <h3 className="text-uppercase resume-section-heading mb-4">Work Experiences</h3>
            {
                workExperiences.map((workExperience, idx) => {
                    return (
                        <div key={idx} className="item mb-3">
                            <div className="row item-heading align-items-center mb-2">
                                <h4 className="item-title col-12 col-md-6 col-lg-8 mb-2 mb-md-0">
                                    {workExperience.jobPosition}
                                </h4>
                                <div className="item-meta col-12 col-md-6 col-lg-4 text-muted text-start text-md-end">
                                    {workExperience.company} | {workExperience.time}
                                </div>
                            </div>
                            <div className="item-content">
                                <ul className={'unstyled'}>
                                    {
                                        workExperience.description.map((description, descriptionIdx) => {
                                        return (
                                            <li key={`${idx}.${descriptionIdx}`}>
                                                {description}
                                            </li>
                                        );
                                    })}
                                </ul>
                                <p className={'fst-italic'}>Technology Stack: </p>
                                <ul className="resume-list">
                                    {
                                        workExperience.technology.map((technology, idxTechnology) => {
                                            return (
                                                <li key={`${idx}.${idxTechnology}`}>
                                                    {technology}
                                                </li>
                                            );
                                        })
                                    }
                                </ul>
                            </div>
                        </div>
                    );
                })
            }
        </section>
    );

}

export default WorkExperiences;