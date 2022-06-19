import React from 'react';
import {IWorkExperience} from '../model/work-experience.model';
import {Col, Row, List} from 'reactstrap';

const WorkExperiences: React.FC<{workExperiences: Array<IWorkExperience>}> = ({workExperiences}) => {

    return (
        <section className="work-section py-3">
            <h3 className="text-uppercase resume-section-heading mb-4">Work Experiences</h3>
            {
                workExperiences.map((workExperience, idx) => {
                    return (
                        <div key={idx} className="item mb-3">
                            <Row className="item-heading align-items-center mb-2">
                                <Col tag={'h4'} md={6} lg={8} className="item-title col-12 mb-2 mb-md-0">
                                    {workExperience.jobPosition}
                                </Col>
                                <Col md={6} lg={4} className="item-meta col-12 text-muted text-start text-md-end">
                                    {workExperience.company} | {workExperience.time}
                                </Col>
                            </Row>
                            <div className="item-content">
                                <List type="unstyled">
                                    {
                                        workExperience.description.map((description, descriptionIdx) => {
                                        return (
                                            <li key={`${idx}.${descriptionIdx}`}>
                                                {description}
                                            </li>
                                        );
                                    })}
                                </List>
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