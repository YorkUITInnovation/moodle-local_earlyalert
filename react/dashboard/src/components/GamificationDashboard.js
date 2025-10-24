import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, Zap, Award, TrendingUp, Users, CheckCircle } from 'lucide-react';

const GamificationDashboard = ({ userStats, teamStats, alerts }) => {
  const [achievements, setAchievements] = useState([]);
  const [streaks, setStreaks] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    calculateUserProgress();
    checkAchievements();
  }, [userStats, alerts]);

  const calculateUserProgress = () => {
    if (!userStats) return;
    
    const resolvedAlerts = userStats.resolvedAlerts || 0;
    const totalXP = resolvedAlerts * 10 + (userStats.fastResolutions || 0) * 25;
    const currentLevel = Math.floor(totalXP / 100) + 1;
    
    setXp(totalXP);
    setLevel(currentLevel);
    setStreaks(userStats.consecutiveDays || 0);
  };

  const checkAchievements = () => {
    const newAchievements = [];
    
    if (userStats?.resolvedAlerts >= 10) {
      newAchievements.push({
        id: 'resolver',
        title: 'Problem Solver',
        description: 'Resolved 10+ student alerts',
        icon: <CheckCircle className="w-6 h-6 text-green-500" />,
        tier: 'bronze'
      });
    }
    
    if (userStats?.fastResolutions >= 5) {
      newAchievements.push({
        id: 'speedster',
        title: 'Speed Demon',
        description: 'Resolved 5+ alerts within 24 hours',
        icon: <Zap className="w-6 h-6 text-yellow-500" />,
        tier: 'gold'
      });
    }
    
    if (streaks >= 7) {
      newAchievements.push({
        id: 'consistent',
        title: 'Consistency Champion',
        description: 'Active for 7+ consecutive days',
        icon: <Target className="w-6 h-6 text-blue-500" />,
        tier: 'silver'
      });
    }
    
    setAchievements(newAchievements);
  };

  const leaderboardData = [
    { name: 'Sarah Johnson', faculty: 'LAPS', points: 2850, level: 15, badge: '🏆' },
    { name: 'Mike Chen', faculty: 'Lassonde', points: 2720, level: 14, badge: '🥈' },
    { name: 'Emily Rodriguez', faculty: 'Health', points: 2680, level: 13, badge: '🥉' },
    { name: 'David Kim', faculty: 'Schulich', points: 2545, level: 13, badge: '⭐' },
    { name: 'You', faculty: userStats?.faculty || 'LAPS', points: xp, level: level, badge: '🎯' }
  ].sort((a, b) => b.points - a.points);

  const progressToNextLevel = ((xp % 100) / 100) * 100;

  return (
    <div className="space-y-6">
      {/* User Progress Card */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Level {level}</h2>
            <p className="opacity-90">Student Success Champion</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{xp}</div>
            <div className="text-sm opacity-75">Total XP</div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress to Level {level + 1}</span>
            <span>{xp % 100}/100 XP</span>
          </div>
          <div className="bg-white/20 rounded-full h-3">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${progressToNextLevel}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold">{userStats?.resolvedAlerts || 0}</div>
            <div className="text-xs opacity-75">Alerts Resolved</div>
          </div>
          <div>
            <div className="text-xl font-bold">{streaks}</div>
            <div className="text-xs opacity-75">Day Streak</div>
          </div>
          <div>
            <div className="text-xl font-bold">{achievements.length}</div>
            <div className="text-xs opacity-75">Achievements</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          Recent Achievements
        </h3>
        
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`border-2 rounded-lg p-4 transition-all duration-300 hover:shadow-md ${
                  achievement.tier === 'gold' ? 'border-yellow-400 bg-yellow-50' :
                  achievement.tier === 'silver' ? 'border-gray-400 bg-gray-50' :
                  'border-orange-400 bg-orange-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {achievement.icon}
                  <div>
                    <div className="font-semibold text-gray-900">{achievement.title}</div>
                    <div className="text-sm text-gray-600">{achievement.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Keep working to unlock achievements!</p>
          </div>
        )}
      </div>

      {/* Team Leaderboard */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-500" />
          Faculty Leaderboard
        </h3>
        
        <div className="space-y-3">
          {leaderboardData.map((user, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                user.name === 'You' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{user.badge}</div>
                <div>
                  <div className={`font-semibold ${user.name === 'You' ? 'text-blue-900' : 'text-gray-900'}`}>
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-600">{user.faculty}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{user.points} XP</div>
                <div className="text-sm text-gray-600">Level {user.level}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-purple-500" />
          Today's Challenges
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div>
              <div className="font-medium text-purple-900">Quick Responder</div>
              <div className="text-sm text-purple-700">Resolve 3 alerts within 2 hours</div>
            </div>
            <div className="text-purple-600 font-bold">+50 XP</div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <div className="font-medium text-green-900">Team Player</div>
              <div className="text-sm text-green-700">Collaborate on 2 cross-faculty cases</div>
            </div>
            <div className="text-green-600 font-bold">+75 XP</div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div>
              <div className="font-medium text-orange-900">Prevention Master</div>
              <div className="text-sm text-orange-700">Identify 1 at-risk student proactively</div>
            </div>
            <div className="text-orange-600 font-bold">+100 XP</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationDashboard;
