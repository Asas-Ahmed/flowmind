from datetime import datetime, timezone
from statistics import mean
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.habit_breaker import QuitJourney, QuitReset, QuitReward
from app.repositories.habit_breaker_repo import journey, journeys, resets, rewards
from app.schemas.habit_breaker_schema import JourneyCreate, JourneyUpdate, ResetCreate, RewardCreate, RewardUpdate

MILESTONES=[
    (1,"First Step","shield","Starting Out"),
    (2,"Forty-Eight Hours","sparkles","Starting Out"),
    (3,"Early Momentum","flame","Starting Out"),
    (5,"Building Rhythm","target","Starting Out"),
    (7,"One Full Week","medal","Momentum"),
    (10,"Double Digits","award","Momentum"),
    (14,"Two Strong Weeks","star","Momentum"),
    (21,"Habit Rewire","brain","Momentum"),
    (30,"One Month","crown","Discipline"),
    (45,"Steady Discipline","shield-check","Discipline"),
    (60,"Two Months","gem","Discipline"),
    (75,"Resilient","heart","Discipline"),
    (90,"Quarter Year","trophy","Major Milestones"),
    (120,"Four Months","rocket","Major Milestones"),
    (180,"Half Year","mountain","Major Milestones"),
    (270,"Nine Months","compass","Major Milestones"),
    (365,"One Year","award","Major Milestones"),
    (500,"Five Hundred Days","sparkles","Legacy"),
    (730,"Two Years","mountain","Legacy"),
    (1000,"One Thousand Days","crown","Legacy"),
]
def utc(dt): return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
def days_between(a,b): return max(0,(utc(b)-utc(a)).total_seconds()/86400)
def serialize(j, rs, rws):
    now=datetime.now(timezone.utc); current_days=days_between(j.quit_at,now)
    jr=[r for r in rs if r.journey_id==j.id]; wr=[r for r in rws if r.journey_id==j.id]
    intervals=[days_between(r.previous_quit_at,r.reset_at) for r in jr]+[current_days]
    weekly_cost=j.cost_per_occurrence*j.occurrences_per_week; weekly_minutes=j.minutes_per_occurrence*j.occurrences_per_week
    return {"id":j.id,"name":j.name,"category":j.category,"icon":j.icon,"color":j.color,"quit_at":j.quit_at,"birth_at":j.birth_at,"why":j.why or [],"triggers":j.triggers or [],"strategy":j.strategy,"is_active":j.is_active,"current_seconds":int((now-utc(j.quit_at)).total_seconds()),"current_days":round(current_days,2),"longest_days":round(max(intervals),2),"shortest_days":round(min(intervals),2),"average_days":round(mean(intervals),2),"previous_days":round(intervals[-2],2) if len(intervals)>1 else 0,"reset_count":len(jr),"money_saved":round(weekly_cost*(current_days/7),2),"time_saved_minutes":round(weekly_minutes*(current_days/7)),"rewards": [{"id":r.id,"title":r.title,"target_days":r.target_days,"estimated_cost":r.estimated_cost,"purchased":r.purchased,"unlocked":current_days>=r.target_days} for r in wr],"rewards_bought":sum(1 for r in wr if r.purchased),"next_milestone":next(({"days":d,"title":t,"icon":i,"category":c,"remaining_days":round(d-current_days,2)} for d,t,i,c in MILESTONES if current_days<d),None)}
def workspace(db,user):
    js=journeys(db,user.id); rs=resets(db,user.id); rws=rewards(db,user.id); data=[serialize(j,rs,rws) for j in js]
    active=[x for x in data if x["is_active"]]; best=max((x["longest_days"] for x in data),default=0)
    achievements=[{"days":d,"title":t,"icon":i,"category":c,"unlocked":best>=d,"progress":round(min(100,(best/d)*100),1)} for d,t,i,c in MILESTONES]
    cal=[{"date":r.reset_at.date().isoformat(),"type":"reset","journey_id":r.journey_id,"note":r.note,"trigger":r.trigger} for r in rs]
    return {"journeys":data,"summary":{"active":len(active),"total_resets":len(rs),"best_days":round(best,2),"money_saved":round(sum(x["money_saved"] for x in active),2),"time_saved_minutes":sum(x["time_saved_minutes"] for x in active),"rewards_bought":sum(x["rewards_bought"] for x in data),"total_rewards":sum(len(x["rewards"]) for x in data),"unlocked_rewards":sum(sum(1 for r in x["rewards"] if r["unlocked"]) for x in data)},"achievements":achievements,"calendar":cal,"motivation":"A reset records useful evidence; it does not erase the progress or lessons that came before it."}
def create(db,user,data:JourneyCreate):
    item=QuitJourney(user_id=user.id,**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return item
def update(db,user,item_id,data:JourneyUpdate):
    item=journey(db,user.id,item_id)
    if not item: raise HTTPException(404,"Quit journey not found")
    for k,v in data.model_dump(exclude_unset=True).items(): setattr(item,k,v)
    db.commit(); db.refresh(item); return item
def remove(db,user,item_id):
    item=journey(db,user.id,item_id)
    if not item: raise HTTPException(404,"Quit journey not found")
    db.delete(item); db.commit()
def reset(db,user,item_id,data:ResetCreate):
    item=journey(db,user.id,item_id)
    if not item: raise HTTPException(404,"Quit journey not found")

    now = datetime.now(timezone.utc)
    reset_at = utc(data.reset_at) if data.reset_at else now
    current_start = utc(item.quit_at)

    if reset_at > now:
        raise HTTPException(400, "A reset cannot be recorded in the future")
    if reset_at < current_start:
        raise HTTPException(400, "The reset must be after the current journey start")

    db.add(QuitReset(
        journey_id=item.id,
        user_id=user.id,
        previous_quit_at=item.quit_at,
        reset_at=reset_at,
        note=data.note,
        trigger=data.trigger,
    ))
    item.quit_at=reset_at
    db.commit()
def add_reward(db,user,item_id,data:RewardCreate):
    if not journey(db,user.id,item_id): raise HTTPException(404,"Quit journey not found")
    item=QuitReward(journey_id=item_id,user_id=user.id,**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return item
def edit_reward(db,user,reward_id,data:RewardUpdate):
    item=db.query(QuitReward).filter(QuitReward.id==reward_id,QuitReward.user_id==user.id).first()
    if not item: raise HTTPException(404,"Reward not found")
    for k,v in data.model_dump(exclude_unset=True).items(): setattr(item,k,v)
    if data.purchased is not None: item.purchased_at=datetime.now(timezone.utc) if data.purchased else None
    db.commit(); db.refresh(item); return item


def remove_reward(db,user,reward_id):
    item=db.query(QuitReward).filter(QuitReward.id==reward_id,QuitReward.user_id==user.id).first()
    if not item: raise HTTPException(404,"Reward not found")
    db.delete(item); db.commit()
