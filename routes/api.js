'use strict';
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

const Schema = mongoose.Schema;
const issueSchema = new Schema(
  {
  issue_title:{type: String, required: true},
  issue_text:{type: String, required: true},
  created_on: {type: Date, default: Date.now},
  updated_on: {type: Date, default: Date.now},
  created_by:{type:String, required: true},
  assigned_to:String,
  open:{type: Boolean, default: true},
  status_text:String,
  project:String
  }
);
const Issues = mongoose.model('issue',issueSchema);

const createIssue = async(issue_title,issue_text,created_by,assigned_to = "",status_text = "",project) =>{
  try{
    const newIssue = new Issues({
      issue_title,
      issue_text,
      created_by,
      assigned_to,
      status_text,
      created_on:new Date(),
      updated_on: new Date(),
      open:true,
      project
    });
    await newIssue.save();
    return newIssue;
  }
  catch(err){
    throw err;
  }
}
module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res){
      try{
        let project = req.params.project;
        const filter = {...req.query, project};
        if(filter.open){
          filter.open = filter.open === 'true';
        }
        const docs = await Issues.find(filter).select('-project');
        return res.json(docs);
      }
      catch(err){
        return res.send('database error');
      }
    })
    
    .post(async function (req, res){
      let project = req.params.project;
      const {issue_title,issue_text,created_by,assigned_to,status_text} = req.body;
      if(!issue_title || !issue_text || !created_by) return res.json({error: "required field(s) missing" });
      try{
        let newIssue = await createIssue(issue_title,issue_text,created_by,assigned_to,status_text,project);
        return res.json(newIssue);
      }
      catch(err){
        return res.send('failed to create issue');
      }
    })
    
    .put(async function (req, res){
        let project = req.params.project;
        const {_id,...rest} = req.body;
        if(!_id){
          return res.json({error: 'missing _id'});
        }

        const updateField = Object.fromEntries(
          Object.entries(rest).filter(([k,v]) => v !== '' && v !== undefined)
        );

        if(Object.entries(updateField).length === 0){
          return res.json({error: 'no update field(s) sent',_id});
        }
        updateField.updated_on = new Date();
        try{
          const updated = await Issues.findOneAndUpdate({_id,project},updateField,{new:true});
          if(!updated) return res.json({error: 'could not update',_id});
          return res.json({result: 'successfully updated',_id});
        }
        catch(err){
        return res.json({error: 'could not update',_id});
      }
    })
    
    .delete( async function (req, res){
      let project = req.params.project;
      const {_id} = req.body;
      if(!_id) return res.json({error:'missing _id'});
      try{
        const deleted =await Issues.findOneAndDelete({_id,project});
        if(!deleted) return res.json({error:'could not delete',_id});
        return res.json({result:'successfully deleted',_id});
      }catch(err){
        return res.json({error:'could not delete',_id});
      }
    });
    
};
