const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const {expect}  = chai;
chai.use(chaiHttp);

suite('Functional Tests', function() {

    const checkValidFields = (res,issue = {}) =>{
        expect(res).to.have.status(200);
        if(!issue.issue_title || !issue.issue_text || !issue.created_by){
            expect(res.body).to.have.property('error','required field(s) missing');
        }
        else{
            expect(res.body).to.include(issue);
            expect(res.body).to.have.property('_id');
        }
        
    }

    test('POST /api/issues/:project with every field',(done) =>{
        const issue = {
            issue_title: "test",
            issue_text:"tested",
            created_by:"Alem",
            assigned_to:"Alem",
            status_text:"LOL"
        };
        chai
            .request(server)
            .post('/api/issues/apitest')
            .send(issue)
            .end((err,res)=>{
                if(err) done(err);
                checkValidFields(res,issue);
                done();
            });
    });
    let testId;
    test('POST /api/issues/:project with only required fields',(done) =>{
        const issue = {
            issue_title:"required issue",
            issue_text: "test required",
            created_by: "Alem"
        }
        chai.request(server)
            .post('/api/issues/apitest')
            .send(issue)
            .end((err,res) =>{
                if(err) done(err);
                checkValidFields(res,issue);
                testId = res.body._id;
                done();
            })
    });

    test('POST /api/issues/:project with empty required fields',(done) =>{
        const issue = {
            assigned_to:"Alem",
            status_text:"missing fields"
        };
        chai.request(server)
            .post('/api/issues/apitest')
            .send(issue)
            .end((err,res) =>{
                if(err) done(err);
                checkValidFields(res,issue);
                done();
            });
    });

    const validIssue = (issue, filters = {}) =>{
        const expectedFields = [
            '_id',
            'issue_title',
            'issue_text',
            'created_by',
            'created_on',
            'updated_on',
            'assigned_to',
            'status_text',
            'open'];
        expect(Object.keys(issue)).to.include.members(expectedFields);
        for(const key in filters){
            expect(issue[key]).to.equal(filters[key]);
        }
    }

    const validResponse = (res,filters = {}) =>{
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        if(res.body.length > 0){
            res.body.forEach(issue => validIssue(issue,filters));
        }
    }

    test('GET /api/issues/:project with no filter',(done) =>{
        chai.request(server)
            .get('/api/issues/apitest')
            .end((err,res) => {
                if(err) done(err);
                validResponse(res);
                done();
            });
    });

    test('GET /api/issues/:project width one filter',(done) =>{
        chai.request(server)
            .get('/api/issues/apitest?created_by=Alem')
            .end((err,res) => {
                if(err) done(err);
                validResponse(res,{created_by:"Alem"});
                done();
            })
    });

    test('GET /api/issues/:project with multiple filter',(done) =>{
        chai.request(server)
            .get('/api/issues/apitest?open=true&assigned_to=Alem')
            .end((err,res) =>{
                if(err) done(err);
                validResponse(res,{open:true,assigned_to:"Alem"});
                done();
            });
    });

    const checkUpdated = (res,fieldUpdate) =>{
        expect(res).to.have.status(200);
        if(!fieldUpdate._id){
            expect(res.body).to.have.property('error','missing _id');
        }
        else if(Object.keys(fieldUpdate).length === 1){
            expect(res.body).to.have.property('error','no update field(s) sent');
            expect(res.body).to.have.property('_id')
        }
        else if(fieldUpdate._id !== testId){
            expect(res.body).to.have.property('error','could not update');
            expect(res.body).to.have.property('_id',fieldUpdate._id);
        }
        else{
            expect(res.body).to.have.property('result','successfully updated');
            expect(res.body).to.have.property('_id',fieldUpdate._id);
        }
    }

    test('PUT /api/issues/:project update with no field',(done) =>{
        const fieldUpdate = {_id:testId};
        chai.request(server)
            .put('/api/issues/apitest')
            .send(fieldUpdate)
            .end((err,res) => {
                if(err) done(err);
                checkUpdated(res,fieldUpdate);
                done();
            });
    });

    test('PUT /api/issues/:project update one field',(done) =>{
        const fieldUpdate = {_id:testId,issue_title:'update title'};
        chai.request(server)
            .put('/api/issues/apitest')
            .send(fieldUpdate)
            .end((err,res) => {
                if(err) done(err);
                checkUpdated(res,fieldUpdate);
                done();
            });
    });
    
    test('PUT /api/issues/:project update multiple fields',(done) =>{
        const fieldUpdate = {_id:testId,issue_title:'update title',issue_text:"this is updated issue"};
        chai.request(server)
            .put('/api/issues/apitest')
            .send(fieldUpdate)
            .end((err,res) => {
                if(err) done(err);
                checkUpdated(res,fieldUpdate);
                done();
            });
    });

    test('PUT /api/issues/:project update with no id',(done) =>{
        const fieldUpdate = {issue_title:'update title no id'};
        chai.request(server)
            .put('/api/issues/apitest')
            .send(fieldUpdate)
            .end((err,res) =>{
                if(err) done(err);
                checkUpdated(res,fieldUpdate);
                done();
            });
    });

    test('PUT /api/issues/:project update with invalid id',(done) =>{
        const fieldUpdate = {_id:"wrong id", issue_title:'u'}
        chai.request(server)
            .put('/api/issues/apitest')
            .send(fieldUpdate)
            .end((err,res) =>{
                if(err) done(err);
                checkUpdated(res,fieldUpdate);
                done();
            });
    });
    
    const checkDeleted = (res,filter) =>{
        expect(res).to.have.status(200);
        if(Object.keys(filter).length === 0){
            expect(res.body).to.have.property('error','missing _id');
        }
        else if(filter._id === testId){
            expect(res.body).to.have.property('result','successfully deleted');
            expect(res.body).to.have.property('_id',filter._id);
        }
        else{
            expect(res.body).to.have.property('error','could not delete');
            expect(res.body).to.have.property('_id',filter._id);
        }
    }
    test('DELETE /api/issues/:project with valid id',(done) =>{
        const deleted = {_id:testId};
        chai.request(server)
            .delete('/api/issues/apitest')
            .send(deleted)
            .end((err,res) =>{
                if(err) done(err);
                checkDeleted(res,deleted);
                done();
            });
    });

    test('DELETE /api/issues/:project with invalid id',(done) =>{
        const deleted = {_id:'wrong id'};
        chai.request(server)
            .delete('/api/issues/apitest')
            .send(deleted)
            .end((err,res) =>{
                if(err) done(err);
                checkDeleted(res,deleted);
                done();
            });
    });

    test('DELETE /api/issues/:project with no id',(done) =>{
        const deleted = {};
        chai.request(server)
            .delete('/api/issues/apitest')
            .send(deleted)
            .end((err,res) =>{
                if(err) done(err);
                checkDeleted(res,deleted);
                done();
            });
    });
});
