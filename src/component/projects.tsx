import React from 'react';
import IProject from '../model/project.model';
import {Col, Row} from 'reactstrap';
import github from '../assets/images/github.svg';

const Projects: React.FC<{projects: Array<IProject>}> = ({projects}) => {

    return (
        <section className="project-section py-3">
            <h3 className="text-uppercase resume-section-heading mb-4">Projects</h3>
            {
                projects.map((project, idx) => {
                    return (
                        <div key={idx} className="item mb-3">
                            <Row className="item-heading align-items-center mb-2">
                                <Col tag={'h4'} md={6} lg={8} className="item-title col-12 mb-2 mb-md-0">
                                    {project.time} | {project.name}
                                </Col>
                                <Col md={6} lg={4} className="item-meta col-12 text-muted text-start text-md-end">
                                    {project.type}
                                </Col>
                            </Row>
                            <div className="item-content">
                                <p>
                                    {project.description}
                                </p>
                                <p className={'text-muted'}>
                                    Technology: {project.technology}
                                </p>
                                {
                                    project.github &&
                                    <p>
                                       <span className={'me-2'}>
                                            <img src={github} alt={'github'} width={15}/>
                                       </span>
                                        Github: <a href={project.github}>{project.github}</a>
                                    </p>
                                }
                            </div>
                        </div>
                    );
                })
            }
        </section>
    );

}

export default Projects;