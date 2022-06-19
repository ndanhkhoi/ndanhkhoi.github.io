import React from 'react';
import {Col, Row} from 'reactstrap';
import {ProfileImage} from '../component';
import resumeProfile from '../assets/images/resume-profile.jpg';

const ResumeIntro: React.FC<{sumary: string}> = ({sumary}) => {

    return (
        <div className="resume-intro py-3">
            <Row className="align-items-center">
                <Col md={3} xl={2} className="col-12 text-center">
                    <ProfileImage src={resumeProfile} />
                </Col>
                <Col className="text-start">
                    <p className="mb-0">
                        {sumary}
                    </p>
                </Col>
            </Row>
        </div>
    );

}

export default ResumeIntro;